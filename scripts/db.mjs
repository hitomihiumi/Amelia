#!/usr/bin/env node
/**
 * Safe database maintenance: backups, migrations that never reset the database, repair of a
 * diverged Prisma history and major PostgreSQL upgrades that keep every row.
 *
 *   npm run db -- <command> [options]
 *
 * Commands
 *   status                  server version, size, backups and the state of the migration history
 *   backup [--keep N]       pg_dump to backups/ (custom format) plus a row-count snapshot; keeps 10
 *   restore <file|latest>   restore a dump in one transaction (a safety backup is taken first)
 *   migrate                 backup, then `prisma migrate deploy`; refuses to touch a broken history
 *   deploy                  for containers: wait for the database, then migrate non-interactively and
 *                           put the database back from the backup if a migration fails
 *   repair                  fix a history Prisma would "reset" for, without touching any data
 *   baseline [--through M]  adopt a database that has data but no migration history
 *   upgrade-pg <major>      docker only: dump, swap the data volume, restore, migrate, verify
 *   verify [file]           compare current row counts with the snapshot of a backup
 *
 * Options  --yes (no prompts)  --no-backup  --dry-run  --docker | --local
 *
 * Needs only Node 18+ (no tsx, no dotenv): copy this one file next to your docker-compose.yml and run
 * `node db.mjs <command>`. Where the database lives is detected: with a running `postgres` compose service everything
 * goes through docker compose (no local PostgreSQL tools needed), otherwise DATABASE_URL is
 * used with pg_dump/psql/pg_restore from PATH (or PG_BIN_DIR).
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
// ---------------------------------------------------------------- config
/** Minimal .env reader so the script runs with nothing but Node (no dotenv, no tsx). */
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
loadEnv(path.join(process.cwd(), ".env"));
const ROOT = process.cwd();

/** How to call this script in the hints: from a checkout it is an npm script, otherwise the file itself. */
const CLI = fs.existsSync(path.join(ROOT, "scripts", "db.mjs"))
  ? "npm run db --"
  : `node ${path.basename(fileURLToPath(import.meta.url))}`;
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");
const BACKUP_DIR = path.resolve(ROOT, process.env.DB_BACKUP_DIR ?? "backups");
const KEEP_DEFAULT = 10;
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter(
  (a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").match(/^--(keep|through|failed)$/),
);
const [command, ...rest] = positional;
const YES = flag("yes");
const DRY = flag("dry-run");
const PG_USER = process.env.POSTGRES_USER ?? "user";
const PG_DB = process.env.POSTGRES_DB ?? "amelia";
// ---------------------------------------------------------------- output helpers
const out = {
  step: (m) => console.log(`\n\x1b[36m▸ ${m}\x1b[0m`),
  ok: (m) => console.log(`\x1b[32m✓ ${m}\x1b[0m`),
  warn: (m) => console.log(`\x1b[33m! ${m}\x1b[0m`),
  info: (m) => console.log(`  ${m}`),
};
function die(message, hint) {
  console.error(`\n\x1b[31m✗ ${message}\x1b[0m`);
  if (hint)
    console.error(
      hint
        .split("\n")
        .map((l) => `  ${l}`)
        .join("\n"),
    );
  process.exit(1);
}
async function confirm(question) {
  if (YES) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`\n${question} [y/N] `)).trim().toLowerCase();
  rl.close();
  if (answer !== "y" && answer !== "yes") die("Cancelled, nothing was changed.");
}
function run(cmd, argv, options = {}) {
  const res = spawnSync(cmd, argv, { encoding: "utf8", maxBuffer: 1 << 28, ...options });
  if (res.error && res.error.code === "ENOENT") {
    die(
      `\`${cmd}\` was not found.`,
      cmd.startsWith("pg_") || cmd === "psql"
        ? "Install the PostgreSQL client tools, point PG_BIN_DIR at them, or use the docker setup."
        : undefined,
    );
  }
  return {
    code: res.status ?? 1,
    stdout: String(res.stdout ?? ""),
    stderr: String(res.stderr ?? ""),
  };
}
/** `docker compose` (v2) or `docker-compose` (v1). */
let composeCmd;
function compose() {
  if (composeCmd !== undefined) return composeCmd;
  composeCmd = null;
  // probes must not abort the script when docker is missing (e.g. inside the migrate container)
  const works = (cmd, argv) => spawnSync(cmd, argv, { stdio: "ignore" }).status === 0;
  if (works("docker", ["compose", "version"])) composeCmd = ["docker", "compose"];
  else if (works("docker-compose", ["version"])) composeCmd = ["docker-compose"];
  return composeCmd;
}
function dc(argv, options = {}) {
  const base = compose();
  if (!base) die("docker compose is not available.");
  return run(base[0], [...base.slice(1), ...argv], options);
}
function detectMode() {
  if (flag("docker")) return "docker";
  if (flag("local")) return "local";
  if (process.env.DB_MODE === "docker" || process.env.DB_MODE === "local")
    return process.env.DB_MODE;
  if (fs.existsSync(path.join(ROOT, "docker-compose.yml")) && compose()) {
    const id = dc(["ps", "-q", "postgres"]).stdout.trim();
    if (id) return "docker";
  }
  return "local";
}
const MODE = command ? detectMode() : "local";
function localUrl() {
  const url = process.env.DATABASE_URL;
  if (!url)
    die(
      "DATABASE_URL is not set.",
      "Put it in .env, or run against the docker setup with --docker.",
    );
  // libpq rejects Prisma's `?schema=public`
  return url.replace(/\?.*$/, "");
}
function pgTool(name) {
  return process.env.PG_BIN_DIR ? path.join(process.env.PG_BIN_DIR, name) : name;
}
/** Runs a PostgreSQL client tool against the database; stdin/stdout can be bound to files. */
function pg(tool, toolArgs, io = {}) {
  const stdio = [io.stdin ?? "ignore", io.stdout ?? "pipe", "pipe"];
  if (MODE === "docker") {
    const base = ["exec", "-T", "postgres", tool, "-U", PG_USER];
    if (tool !== "pg_dumpall" && !io.noDb) base.push("-d", PG_DB);
    return dc([...base, ...toolArgs], { stdio });
  }
  const url = localUrl();
  const target = io.noDb ? [] : ["-d", url];
  return run(pgTool(tool), [...target, ...toolArgs], { stdio });
}
function sql(query) {
  const res = pg("psql", ["-X", "-At", "-F", "\t", "-v", "ON_ERROR_STOP=1", "-c", query]);
  if (res.code !== 0) die("A query failed.", `${query}\n${res.stderr.trim()}`);
  return res.stdout.trim() === ""
    ? []
    : res.stdout
        .trim()
        .split("\n")
        .map((l) => l.split("\t"));
}
/** Prisma CLI: in docker mode inside the `migrate` service (the image carries the migrations of the release). */
function prisma(prismaArgs, options = {}) {
  const stdio = options.capture ? "pipe" : "inherit";
  if (MODE === "docker") {
    return dc(["run", "--rm", "-T", "migrate", "npx", "prisma", ...prismaArgs], { stdio });
  }
  return run("npx", ["prisma", ...prismaArgs], { stdio, shell: process.platform === "win32" });
}
/** Lists the migrations of the release. In docker mode they are read from the image, so no checkout is needed. */
const LIST_IN_IMAGE = `const fs=require("fs"),c=require("crypto"),d="/app/prisma/migrations";
const r=fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).filter(e=>e.isDirectory()&&fs.existsSync(d+"/"+e.name+"/migration.sql")).map(e=>({name:e.name,checksum:c.createHash("sha256").update(fs.readFileSync(d+"/"+e.name+"/migration.sql")).digest("hex")})):[];
console.log(JSON.stringify(r))`;
let migrationCache;
function localMigrations() {
  if (migrationCache) return migrationCache;
  migrationCache = readLocalMigrations().sort((a, b) => a.name.localeCompare(b.name));
  return migrationCache;
}
function readLocalMigrations() {
  if (MODE === "docker") {
    // the image decides what `prisma migrate deploy` will apply, whatever the checkout looks like
    const res = dc(["run", "--rm", "-T", "migrate", "node", "-e", LIST_IN_IMAGE]);
    if (res.code !== 0) die("Could not read the migrations from the bot image.", res.stderr.trim());
    return JSON.parse(res.stdout.trim().split("\n").pop() ?? "[]");
  }
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && fs.existsSync(path.join(MIGRATIONS_DIR, d.name, "migration.sql")),
    )
    .map((d) => ({
      name: d.name,
      // Prisma stores the SHA-256 of the file as lowercase hex
      checksum: createHash("sha256")
        .update(fs.readFileSync(path.join(MIGRATIONS_DIR, d.name, "migration.sql")))
        .digest("hex"),
    }));
}
function userTables() {
  return sql(
    "select tablename from pg_tables where schemaname = 'public' and tablename <> '_prisma_migrations' order by 1",
  ).map((r) => r[0]);
}
function readHistory() {
  if (sql("select to_regclass('public._prisma_migrations') is not null")[0][0] !== "t") return null;
  return sql(
    "select migration_name, checksum, (finished_at is not null)::text, (rolled_back_at is not null)::text from _prisma_migrations order by started_at, migration_name",
  ).map(([name, checksum, finished, rolledBack]) => ({
    name,
    checksum,
    finished: finished === "true",
    rolledBack: rolledBack === "true",
  }));
}
/** Judges the history from the database and the migrations folder alone, so no Prisma output is parsed. */
function health() {
  const history = readHistory();
  const local = localMigrations();
  const tables = userTables();
  if (history === null || history.length === 0) {
    return tables.length > 0
      ? { state: "unbaselined", tables: tables.length }
      : { state: "pending", names: local.map((m) => m.name) };
  }
  const problems = [];
  const localByName = new Map(local.map((m) => [m.name, m]));
  const applied = new Set();
  for (const row of history) {
    if (row.rolledBack) continue;
    if (!row.finished) {
      problems.push({ kind: "failed", name: row.name });
      continue;
    }
    const mine = localByName.get(row.name);
    if (!mine) problems.push({ kind: "dbOnly", name: row.name });
    else if (mine.checksum !== row.checksum)
      problems.push({ kind: "modified", name: row.name, checksum: mine.checksum });
    applied.add(row.name);
  }
  const pending = local
    .filter(
      (m) =>
        !applied.has(m.name) && !problems.some((p) => p.kind === "failed" && p.name === m.name),
    )
    .map((m) => m.name);
  if (problems.length > 0) return { state: "broken", problems, pending };
  return pending.length > 0 ? { state: "pending", names: pending } : { state: "upToDate" };
}
function describeProblem(p) {
  switch (p.kind) {
    case "failed":
      return `${p.name}: a previous attempt to apply it failed and is still recorded`;
    case "dbOnly":
      return `${p.name}: recorded in the database but missing from prisma/migrations (another project ran its own migrations here?)`;
    case "modified":
      return `${p.name}: the file was edited after it was applied (checksum differs)`;
  }
}
function printHealth(h) {
  switch (h.state) {
    case "upToDate":
      out.ok("Migration history is in sync with prisma/migrations.");
      break;
    case "pending":
      out.warn(`${h.names.length} migration(s) to apply: ${h.names.join(", ")}`);
      break;
    case "unbaselined":
      out.warn(
        `The database has ${h.tables} table(s) but no Prisma migration history. \`${CLI} baseline\` adopts it without a reset.`,
      );
      break;
    case "broken":
      out.warn("The migration history is out of sync (this is what makes Prisma ask for a reset):");
      for (const p of h.problems) out.info(`- ${describeProblem(p)}`);
      out.info(`\`${CLI} repair\` fixes the bookkeeping and keeps all data.`);
      break;
  }
}
function ensureBackupDir() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".dump"))
    .sort();
}
function rowCounts() {
  const counts = {};
  for (const table of userTables())
    counts[table] = Number(sql(`select count(*) from "${table}"`)[0][0]);
  return counts;
}
function serverVersion() {
  return sql("show server_version")[0][0];
}
function snapshotPath(dump) {
  return `${dump}.json`;
}
function backup(label = "backup") {
  ensureBackupDir();
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const file = path.join(BACKUP_DIR, `${PG_DB}-${stamp}-${label}.dump`);
  out.step(`Backing up to ${path.relative(ROOT, file)}`);
  if (DRY) {
    out.info("(dry run) pg_dump -Fc --no-owner --no-acl");
    return file;
  }
  const fd = fs.openSync(file, "w");
  const res = pg("pg_dump", ["-Fc", "--no-owner", "--no-acl"], { stdout: fd });
  fs.closeSync(fd);
  if (res.code !== 0) {
    fs.rmSync(file, { force: true });
    die("pg_dump failed.", res.stderr.trim());
  }
  if (fs.statSync(file).size === 0) {
    fs.rmSync(file, { force: true });
    die("The dump is empty.", res.stderr.trim());
  }
  // a dump that cannot be listed cannot be restored either
  if (!listDump(file)) {
    fs.rmSync(file, { force: true });
    die("The dump failed validation (pg_restore --list).");
  }
  const snapshot = {
    createdAt: new Date().toISOString(),
    serverVersion: serverVersion(),
    counts: rowCounts(),
    migrations: (readHistory() ?? []).map((r) => r.name),
  };
  fs.writeFileSync(snapshotPath(file), JSON.stringify(snapshot, null, 2));
  const rows = Object.values(snapshot.counts).reduce((a, b) => a + b, 0);
  out.ok(
    `${(fs.statSync(file).size / 1024).toFixed(0)} KiB, ${Object.keys(snapshot.counts).length} tables, ${rows} rows (PostgreSQL ${snapshot.serverVersion})`,
  );
  return file;
}
function listDump(file) {
  if (MODE === "docker") {
    const fd = fs.openSync(file, "r");
    const res = dc(["exec", "-T", "postgres", "pg_restore", "--list"], {
      stdio: [fd, "pipe", "pipe"],
    });
    fs.closeSync(fd);
    return res.code === 0;
  }
  return run(pgTool("pg_restore"), ["--list", file], { stdio: "pipe" }).code === 0;
}
function prune(keep) {
  const all = listBackups();
  for (const f of all.slice(0, Math.max(0, all.length - keep))) {
    fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
    fs.rmSync(snapshotPath(path.join(BACKUP_DIR, f)), { force: true });
  }
}
function resolveBackup(arg) {
  if (!arg || arg === "latest") {
    const latest = listBackups().pop();
    if (!latest) die("There are no backups yet.", `Create one with: ${CLI} backup`);
    return path.join(BACKUP_DIR, latest);
  }
  // a path, a file name from backups/, or any part of a name ("20261004-1141", "before-repair")
  const byName = listBackups().filter((f) => f.includes(arg));
  const candidate = fs.existsSync(arg) ? arg : path.join(BACKUP_DIR, arg);
  if (!fs.existsSync(candidate)) {
    if (byName.length === 0) die(`Backup not found: ${arg}`);
    if (byName.length > 1)
      die(`"${arg}" matches ${byName.length} backups, be more specific:`, byName.join("\n"));
    return path.join(BACKUP_DIR, byName[0]);
  }
  return path.resolve(candidate);
}
/**
 * Puts the database back exactly as the dump has it. The schema is dropped and recreated inside the same
 * transaction as the restore, so tables a failed migration created after the backup do not survive, and
 * if anything fails the transaction rolls back and the database stays as it was.
 */
function restoreDump(file) {
  out.step(`Restoring ${path.relative(ROOT, file)} (single transaction: all or nothing)`);
  if (DRY) {
    out.info("(dry run) drop schema public, load the dump, all in one transaction");
    return;
  }
  ensureBackupDir();
  const script = path.join(BACKUP_DIR, `.restore-${process.pid}.sql`);
  try {
    // 1. the dump as plain SQL (pg_restore reads the custom-format archive, nothing is executed yet)
    const input = fs.openSync(file, "r");
    const output = fs.openSync(script, "w");
    fs.writeSync(output, "DROP SCHEMA IF EXISTS public CASCADE;\nCREATE SCHEMA public;\n");
    const convert = pg("pg_restore", ["--no-owner", "--no-acl", "-f", "-"], {
      stdin: input,
      stdout: output,
      noDb: true,
    });
    fs.closeSync(input);
    fs.closeSync(output);
    if (convert.code !== 0)
      die("The dump could not be read; the database was not touched.", convert.stderr.trim());

    // 2. run it in one transaction
    const source = fs.openSync(script, "r");
    const res = pg("psql", ["-X", "-q", "-1", "-v", "ON_ERROR_STOP=1", "-f", "-"], {
      stdin: source,
    });
    fs.closeSync(source);
    if (res.code !== 0)
      die(
        "The restore failed; the transaction was rolled back and the database is as it was.",
        res.stderr.trim(),
      );
  } finally {
    fs.rmSync(script, { force: true });
  }
  out.ok("Restored.");
}
function verifyCounts(file, { allowMore }) {
  const snapPath = snapshotPath(file);
  if (!fs.existsSync(snapPath)) {
    out.warn("No row-count snapshot next to this backup, skipping the comparison.");
    return true;
  }
  const snapshot = JSON.parse(fs.readFileSync(snapPath, "utf8"));
  const now = rowCounts();
  let good = true;
  for (const [table, before] of Object.entries(snapshot.counts)) {
    const after = now[table];
    if (after === undefined) {
      out.warn(`${table}: table is missing (had ${before} rows)`);
      good = false;
    } else if (after < before || (!allowMore && after !== before)) {
      out.warn(`${table}: ${before} rows before, ${after} now`);
      good = false;
    }
  }
  if (!allowMore) {
    for (const table of Object.keys(now)) {
      if (!(table in snapshot.counts)) {
        out.warn(`${table}: this table is not in the backup`);
        good = false;
      }
    }
  }
  if (good) out.ok(`All ${Object.keys(snapshot.counts).length} tables keep their rows.`);
  return good;
}
// ---------------------------------------------------------------- commands
function status() {
  out.step(
    `Database (${MODE === "docker" ? "docker compose service `postgres`" : "DATABASE_URL"})`,
  );
  out.info(`PostgreSQL ${serverVersion()}`);
  out.info(
    `Size ${sql("select pg_size_pretty(pg_database_size(current_database()))")[0][0]}, ${userTables().length} tables`,
  );
  out.step("Migration history");
  printHealth(health());
  out.step("Backups");
  const all = listBackups();
  if (all.length === 0) out.info(`none yet (${CLI} backup)`);
  for (const f of all.slice(-5))
    out.info(`${f}  ${(fs.statSync(path.join(BACKUP_DIR, f)).size / 1024).toFixed(0)} KiB`);
}
function cmdBackup() {
  const keep = Number(option("keep") ?? process.env.DB_BACKUP_KEEP ?? KEEP_DEFAULT);
  backup();
  if (!DRY) prune(keep);
}
async function cmdRestore() {
  const file = resolveBackup(rest[0]);
  await confirm(
    `Replace the contents of "${PG_DB}" with ${path.basename(file)}? A safety backup is taken first.`,
  );
  if (!flag("no-backup")) backup("before-restore");
  if (MODE === "docker" && !DRY) dc(["stop", "bot"], { stdio: "ignore" });
  restoreDump(file);
  printHealth(health());
  if (MODE === "docker" && !DRY) out.info("Start the bot again with: docker compose up -d");
}
async function cmdMigrate() {
  out.step("Checking the migration history");
  const h = health();
  printHealth(h);
  if (h.state === "upToDate") return;
  if (h.state === "unbaselined" || h.state === "broken") {
    die("Not applying anything: the history needs attention first. Nothing was changed.");
  }
  if (!flag("no-backup")) backup("before-migrate");
  out.step(`Applying ${h.names.length} migration(s)`);
  if (DRY) {
    out.info("(dry run) prisma migrate deploy");
    return;
  }
  const res = prisma(["migrate", "deploy"]);
  if (res.code !== 0) {
    const latest = listBackups().pop();
    die(
      "`prisma migrate deploy` failed. The database was NOT reset.",
      [
        "Each migration runs in its own transaction, so the failed one left nothing half-done;",
        "the migrations before it stay applied. Fix the cause, then run this command again.",
        latest ? `To go back to the state before this run: ${CLI} restore ${latest}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  printHealth(health());
}
/**
 * The command of the compose `migrate` service. No prompts, no reset: wait for the database, apply
 * pending migrations after a backup, and if one fails restore that backup so the database is exactly
 * as it was before this run. Exits non-zero in every case where the bot must not start.
 */
async function cmdDeploy() {
  waitForDatabase();

  out.step("Checking the migration history");
  const h = health();
  printHealth(h);
  if (h.state === "upToDate") return;
  if (h.state === "unbaselined" || h.state === "broken") {
    die(
      "The migration history needs attention. Nothing was changed, and the bot will not start until it is fixed.",
      [
        "Look:      docker compose run --rm migrate node scripts/db.mjs status",
        "Fix:       docker compose run --rm migrate node scripts/db.mjs repair   (or baseline)",
        "Then:      docker compose up -d",
      ].join("\n"),
    );
  }

  const file = backup("before-migrate");
  prune(Number(option("keep") ?? process.env.DB_BACKUP_KEEP ?? KEEP_DEFAULT));

  out.step(`Applying ${h.names.length} migration(s)`);
  const res = prisma(["migrate", "deploy"]);
  if (res.code === 0) {
    const after = health();
    if (after.state === "upToDate") {
      out.ok("Migrations applied.");
      return;
    }
    out.warn("The migrations ran but the history still does not match prisma/migrations.");
    printHealth(after);
  }

  out.warn("The migration failed. Putting the database back from the backup taken a moment ago.");
  restoreDump(file);
  const intact = verifyCounts(file, { allowMore: false });
  printHealth(health());
  die(
    intact
      ? "Migration failed; the database was restored to its state before this run. The bot was not started."
      : "Migration failed and the restore finished, but the row counts differ from the backup. Check them before starting the bot.",
    [
      `Backup: ${path.relative(ROOT, file)}`,
      "Fix the cause (usually: the bot image and the database are out of step), then start again.",
    ].join("\n"),
  );
}
async function cmdRepair() {
  const h = health();
  if (h.state !== "broken") {
    printHealth(h);
    if (h.state === "unbaselined") out.info("This one needs `baseline`, not `repair`.");
    else out.ok("Nothing to repair.");
    return;
  }
  printHealth(h);
  out.step("Plan (only the _prisma_migrations bookkeeping table changes, never your data)");
  for (const p of h.problems) {
    if (p.kind === "dbOnly") out.info(`forget ${p.name}`);
    if (p.kind === "modified") out.info(`accept the current file of ${p.name} (new checksum)`);
    if (p.kind === "failed")
      out.info(
        `mark ${p.name} as ${option("failed") === "applied" ? "applied" : "rolled back"} (--failed applied|rolled-back)`,
      );
  }
  if (h.problems.some((p) => p.kind === "dbOnly")) {
    out.warn(
      "`forget` assumes those migrations created nothing your schema still needs. If prisma/migrations does not produce the same schema, run `prisma migrate diff` afterwards.",
    );
  }
  await confirm("Apply this plan?");
  if (!flag("no-backup")) backup("before-repair");
  if (DRY) return;
  for (const p of h.problems) {
    if (p.kind === "dbOnly")
      sql(
        `delete from _prisma_migrations where migration_name = '${p.name.replace(/'/g, "''")}' returning 1`,
      );
    if (p.kind === "modified")
      sql(
        `update _prisma_migrations set checksum = '${p.checksum}' where migration_name = '${p.name.replace(/'/g, "''")}' returning 1`,
      );
    if (p.kind === "failed") {
      const mode = option("failed") === "applied" ? "--applied" : "--rolled-back";
      const res = prisma(["migrate", "resolve", mode, p.name]);
      if (res.code !== 0) die(`prisma migrate resolve failed for ${p.name}.`);
    }
  }
  out.ok("History repaired.");
  const after = health();
  printHealth(after);
  if (after.state === "pending") out.info(`Apply the pending migrations with: ${CLI} migrate`);
}
async function cmdBaseline() {
  const h = health();
  if (h.state !== "unbaselined") {
    printHealth(h);
    out.info("Baseline is only for a database that has tables but no migration history.");
    return;
  }
  const local = localMigrations();
  const through = option("through");
  const upTo = through
    ? local.findIndex((m) => m.name === through || m.name.startsWith(through))
    : local.length - 1;
  if (upTo < 0)
    die(`Unknown migration: ${through}`, `Known: ${local.map((m) => m.name).join(", ")}`);
  const marked = local.slice(0, upTo + 1);
  if (!through) {
    out.step("Checking that the database already matches prisma/schema.prisma");
    const diff = prisma(
      [
        "migrate",
        "diff",
        "--from-config-datasource",
        "--to-schema",
        "prisma/schema.prisma",
        "--exit-code",
      ],
      { capture: true },
    );
    if (diff.code === 2) {
      die(
        "The database does not match the current schema, so marking every migration as applied would hide real differences.",
        [
          diff.stdout.trim(),
          `Mark only the migrations the database really has:  ${CLI} baseline --through <migration_name>`,
          `then apply the rest with:                           ${CLI} migrate`,
        ].join("\n"),
      );
    }
    if (diff.code !== 0) die("`prisma migrate diff` failed.", diff.stderr.trim());
    out.ok("The schema matches.");
  }
  out.info(
    `Will record ${marked.length} migration(s) as already applied: ${marked[0].name} … ${marked[marked.length - 1].name}`,
  );
  await confirm("Baseline the database?");
  if (!flag("no-backup")) backup("before-baseline");
  if (DRY) return;
  for (const m of marked) {
    const res = prisma(["migrate", "resolve", "--applied", m.name], { capture: true });
    if (res.code !== 0)
      die(`Could not mark ${m.name} as applied.`, res.stderr.trim() || res.stdout.trim());
  }
  out.ok("Baselined.");
  printHealth(health());
}
async function cmdUpgradePg() {
  if (MODE !== "docker")
    die(
      "upgrade-pg works on the docker compose setup.",
      "For a local PostgreSQL use your package manager's pg_upgrade, or: backup, install the new version, restore.",
    );
  const target = Number(rest[0]);
  if (!Number.isInteger(target) || target < 12)
    die(`Give the target major version, e.g.: ${CLI} upgrade-pg 17`);
  const currentNum = Number(sql("show server_version_num")[0][0]);
  const current = Math.floor(currentNum / 10000);
  if (target === current && !flag("force")) die(`Already running PostgreSQL ${current}.`);
  if (target < current) die(`Downgrades are not supported (running ${current}).`);
  const container = dc(["ps", "-q", "postgres"]).stdout.trim();
  const volume = run("docker", [
    "inspect",
    "-f",
    '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}',
    container,
  ]).stdout.trim();
  if (!volume) die("Could not find the data volume of the postgres container.");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "").replace("T", "-");
  const keepVolume = `${volume}_pg${current}_${stamp}`;
  const envFile = path.join(ROOT, ".env");
  out.step(`Upgrade PostgreSQL ${current} → ${target}`);
  out.info("1. dump the database and the roles, take a row-count snapshot");
  out.info(
    `2. stop bot and database, copy the old data volume to "${keepVolume}" (kept until you delete it)`,
  );
  out.info(
    `3. start PostgreSQL ${target} on a fresh volume and restore the dump in one transaction`,
  );
  out.info(
    "4. run `prisma migrate deploy` (the history was restored with the data, so nothing is reset)",
  );
  out.info("5. compare every table's row count with the snapshot, then start the bot");
  if (DRY) {
    out.info("(dry run) nothing was changed.");
    return;
  }
  await confirm("Start the upgrade? The bot will be offline for a few minutes.");
  const file = backup(`pg${current}-to-pg${target}`);
  const globals = fs.openSync(`${file}.globals.sql`, "w");
  dc(["exec", "-T", "postgres", "pg_dumpall", "-U", PG_USER, "--globals-only"], {
    stdio: ["ignore", globals, "pipe"],
  });
  fs.closeSync(globals);
  const rollback = [
    "To go back to the old version:",
    `  1. set POSTGRES_VERSION=${current} in .env`,
    "  2. docker compose stop postgres && docker compose rm -f postgres",
    `  3. docker volume rm ${volume}`,
    `  4. docker volume create ${volume}`,
    `  5. docker run --rm -v ${keepVolume}:/from:ro -v ${volume}:/to alpine sh -c "cp -a /from/. /to/"`,
    "  6. docker compose up -d",
  ].join("\n");
  out.step("Stopping the services");
  dc(["stop", "bot", "migrate"], { stdio: "ignore" });
  dc(["stop", "postgres"]);
  out.step(`Keeping a copy of the old data volume as ${keepVolume}`);
  if (run("docker", ["volume", "create", keepVolume]).code !== 0)
    die("Could not create the backup volume.");
  const copy = run("docker", [
    "run",
    "--rm",
    "-v",
    `${volume}:/from:ro`,
    "-v",
    `${keepVolume}:/to`,
    "alpine",
    "sh",
    "-c",
    "cp -a /from/. /to/",
  ]);
  if (copy.code !== 0) {
    dc(["start", "postgres"], { stdio: "ignore" });
    die(
      "Copying the data volume failed; the old database was started again and nothing changed.",
      copy.stderr.trim(),
    );
  }
  out.step(`Starting PostgreSQL ${target} on a fresh volume`);
  dc(["rm", "-f", "postgres"], { stdio: "ignore" });
  run("docker", ["volume", "rm", volume]);
  setEnv(envFile, "POSTGRES_VERSION", String(target));
  const up = dc(["up", "-d", "postgres"]);
  if (up.code !== 0) die("The new PostgreSQL did not start.", `${up.stderr.trim()}\n\n${rollback}`);
  waitForDatabase();
  try {
    restoreDump(file);
  } catch {
    die("Restore failed.", rollback);
  }
  out.step("Applying migrations");
  const migrate = dc(["run", "--rm", "-T", "migrate"], { stdio: "inherit" });
  if (migrate.code !== 0)
    out.warn(`migrate exited with ${migrate.code}; check it with: ${CLI} status\n${rollback}`);
  out.step("Verifying");
  const same = verifyCounts(file, { allowMore: true });
  if (!same)
    die(
      "Row counts differ from the snapshot. The bot was NOT started.",
      `Dump: ${file}\n${rollback}`,
    );
  dc(["up", "-d"], { stdio: "inherit" });
  out.ok(`PostgreSQL ${target} is running with all data.`);
  out.info(
    `The old data is still in the volume ${keepVolume}; remove it with \`docker volume rm ${keepVolume}\` once you are happy.`,
  );
}
function waitForDatabase() {
  out.info("waiting for the database…");
  for (let i = 0; i < 60; i++) {
    if (pg("pg_isready", []).code === 0) return;
    spawnSync(process.execPath, ["-e", "setTimeout(()=>{},2000)"]);
  }
  die("The database did not become ready in time.");
}
function setEnv(file, key, value) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const line = `${key}=${value}`;
  const next = new RegExp(`^${key}=.*$`, "m").test(text)
    ? text.replace(new RegExp(`^${key}=.*$`, "m"), line)
    : `${text}${text.endsWith("\n") || text === "" ? "" : "\n"}${line}\n`;
  fs.writeFileSync(file, next);
}
function cmdVerify() {
  const file = resolveBackup(rest[0]);
  out.step(`Comparing with ${path.basename(file)}`);
  const good = verifyCounts(file, { allowMore: true });
  printHealth(health());
  if (!good) process.exit(1);
}
// ---------------------------------------------------------------- main
function usage() {
  const text = fs
    .readFileSync(fileURLToPath(import.meta.url), "utf8")
    .split("*/")[0]
    .split("\n")
    .slice(1)
    .map((l) => l.replace(/^ \* ?/, ""))
    .join("\n");
  console.log(text.trim());
}
async function main() {
  switch (command) {
    case "status":
      return status();
    case "backup":
      return cmdBackup();
    case "restore":
      return cmdRestore();
    case "deploy":
      return cmdDeploy();
    case "migrate":
      return cmdMigrate();
    case "repair":
      return cmdRepair();
    case "baseline":
      return cmdBaseline();
    case "upgrade-pg":
      return cmdUpgradePg();
    case "verify":
      return cmdVerify();
    default:
      return usage();
  }
}
main().catch((error) => die(error instanceof Error ? error.message : String(error)));
