// Ships the warnings and errors of the Amelia containers into Redis, where the dashboard's admin
// panel reads them (Logs page). Runs as the `logs` service of docker-compose.yml.
//
// - Only containers of the same compose project as this one are read (LOG_PROJECT overrides it),
//   so other stacks on the host never end up in the panel.
// - Talks to the Docker Engine API over the unix socket (read-only calls: list, inspect, logs).
// - Keeps only warn/error entries (LOG_LEVELS), at most LOG_RETENTION_HOURS old.
// - Entries are idempotent: replaying a container's log after a restart does not duplicate them.
import http from "node:http";
import { Redis } from "ioredis";

const SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const RETENTION_MS = Number(process.env.LOG_RETENTION_HOURS || 24) * 3_600_000;
const MAX_ENTRIES = Number(process.env.LOG_MAX_ENTRIES || 20_000);
const MAX_MESSAGE = 4_000;
const KEEP = new Set((process.env.LOG_LEVELS || "warn,error").split(",").map((s) => s.trim()));
const SELF = process.env.HOSTNAME || "";
const PROJECT_LABEL = "com.docker.compose.project";

/** Same key the dashboard reads. */
const LOG_KEY = "amelia:logs";

const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
redis.on("error", (error) => console.error("[logs] Redis:", error.message));

/** name -> { id, since, stop } for running containers that are followed. */
const followed = new Map();
/** Ids of stopped containers whose log was already read once. */
const replayed = new Set();

let project = process.env.LOG_PROJECT || "";

function docker(path, { stream = false } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ socketPath: SOCKET, path, method: "GET" }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        res.resume();
        reject(new Error(`Docker API ${res.statusCode} for ${path}`));
        return;
      }
      if (stream) return resolve({ req, res });
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
    });
    req.on("error", reject);
    req.end();
  });
}

/**
 * Guess the severity of one line. Docker records only the stream, and PostgreSQL writes everything
 * (checkpoints included) to stderr, so an explicit level in the text wins over the stream.
 */
export function classify(message, stream) {
  // PostgreSQL: "... [25] LOG:  ...", ERROR / FATAL / PANIC / WARNING.
  if (/\b(PANIC|FATAL|ERROR):/.test(message)) return "error";
  if (/\bWARNING:/.test(message)) return "warn";
  if (/\b(LOG|INFO|NOTICE|DEBUG[1-5]?|DETAIL|HINT|STATEMENT):/.test(message)) return "info";
  // Redis: "1:M 01 Jan 2026 10:00:00.000 # message" — '#' is a warning, '*' a notice, '-' verbose.
  if (/^\d+:[A-Za-z] \d{1,2} \w{3} \d{4} [\d:.]+ # /.test(message)) return "warn";
  if (/^\d+:[A-Za-z] \d{1,2} \w{3} \d{4} [\d:.]+ [*.-] /.test(message)) return "info";
  if (/\b(unhandled|uncaught|fatal|panic|ECONN\w*|ETIMEDOUT|ENOTFOUND)\b|\b\w*Error\b|\bfailed\b/i.test(message)) return "error";
  if (/(^|[\s[(])(warn|warning|deprecated)(:|\]|\)|\s*-)/i.test(message)) return "warn";
  // Anything else on stderr is most likely a console.error().
  return stream === "stderr" ? "error" : "info";
}

const CONTINUATION = /^(\s+at |\s{2,}\S|Caused by:|\}|\)|\])/;

async function push(entry) {
  await redis.zadd(LOG_KEY, entry.ts, JSON.stringify(entry));
}

async function trim() {
  try {
    await redis.zremrangebyscore(LOG_KEY, "-inf", Date.now() - RETENTION_MS);
    await redis.zremrangebyrank(LOG_KEY, 0, -(MAX_ENTRIES + 1));
  } catch (error) {
    console.error("[logs] trim failed:", error.message);
  }
}

/** Drops entries of containers that do not belong to the project (left by older versions). */
async function purge(names) {
  const rows = await redis.zrange(LOG_KEY, 0, -1);
  const stale = rows.filter((raw) => {
    try {
      const entry = JSON.parse(raw);
      return !names.has(entry.container) || !KEEP.has(entry.level);
    } catch {
      return true;
    }
  });
  for (let i = 0; i < stale.length; i += 500) await redis.zrem(LOG_KEY, ...stale.slice(i, i + 500));
  if (stale.length > 0) console.log(`[logs] removed ${stale.length} stale entries`);
}

/** Parses Docker's multiplexed log stream (8-byte frame header) or a raw TTY stream. */
function readLogs(name, id, tty, since, follow, state) {
  let buffer = Buffer.alloc(0);
  let pending = null; // an entry that may still receive stack-trace lines
  let flushTimer = null;

  const flush = () => {
    clearTimeout(flushTimer);
    const entry = pending;
    pending = null;
    if (entry && KEEP.has(entry.level)) push(entry).catch(() => {});
  };

  const onLine = (stream, line) => {
    // With timestamps=true every line starts with an RFC3339Nano timestamp.
    const space = line.indexOf(" ");
    if (space < 20) return;
    const stamp = line.slice(0, space);
    const ts = Date.parse(stamp);
    if (Number.isNaN(ts)) return;
    if (state) state.since = Math.max(state.since, Math.floor(ts / 1000));
    if (ts < Date.now() - RETENTION_MS) return;

    // eslint-disable-next-line no-control-regex
    const message = line.slice(space + 1).replace(/\u001b\[[0-9;]*m/g, "").trimEnd();
    if (!message) return;

    if (pending && CONTINUATION.test(message) && ts - pending.ts < 2_000) {
      if (pending.message.length < MAX_MESSAGE) pending.message += `\n${message}`;
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 500);
      return;
    }

    flush();
    pending = { ts, id: stamp, container: name, stream, level: classify(message, stream), message: message.slice(0, MAX_MESSAGE) };
    flushTimer = setTimeout(flush, 500);
  };

  const onFrame = (stream, payload) => {
    for (const line of payload.toString("utf8").split("\n")) if (line) onLine(stream, line);
  };

  const query = `stdout=1&stderr=1&follow=${follow ? 1 : 0}&timestamps=1&since=${since}`;
  docker(`/containers/${id}/logs?${query}`, { stream: true })
    .then(({ req, res }) => {
      if (state) state.stop = () => req.destroy();
      res.on("data", (chunk) => {
        if (tty) return onFrame("stdout", chunk);
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= 8) {
          const size = buffer.readUInt32BE(4);
          if (buffer.length < 8 + size) break;
          onFrame(buffer[0] === 2 ? "stderr" : "stdout", buffer.subarray(8, 8 + size));
          buffer = buffer.subarray(8 + size);
        }
      });
      const end = () => {
        flush();
        if (follow) followed.delete(name);
      };
      res.on("end", end);
      res.on("error", end);
      req.on("error", end);
    })
    .catch((error) => {
      console.error(`[logs] ${name}:`, error.message);
      if (follow) followed.delete(name);
    });
}

async function findProject() {
  if (project) return;
  try {
    const self = await docker(`/containers/${SELF}/json`);
    project = self.Config?.Labels?.[PROJECT_LABEL] || "";
  } catch (error) {
    console.error("[logs] could not inspect itself:", error.message);
  }
  if (!project) throw new Error("not part of a compose project; set LOG_PROJECT");
  console.log(`[logs] collecting the containers of the "${project}" project`);
}

let firstScan = true;

async function scan() {
  await findProject();

  const filters = encodeURIComponent(JSON.stringify({ label: [`${PROJECT_LABEL}=${project}`] }));
  const containers = await docker(`/containers/json?all=1&filters=${filters}`);
  const names = new Set();
  const running = new Set();
  const since = Math.floor((Date.now() - RETENTION_MS) / 1000);

  for (const container of containers) {
    if (SELF && container.Id.startsWith(SELF)) continue; // do not ship our own output back
    const name = (container.Names?.[0] || container.Id).replace(/^\//, "");
    names.add(name);

    const details = await docker(`/containers/${container.Id}/json`);
    const tty = Boolean(details.Config?.Tty);

    if (container.State !== "running") {
      // A finished container (the migration, a crashed bot): read its log once.
      if (!replayed.has(container.Id)) {
        replayed.add(container.Id);
        readLogs(name, container.Id, tty, since, false, null);
      }
      continue;
    }

    running.add(name);
    const known = followed.get(name);
    if (known?.id === container.Id) continue;
    known?.stop?.();

    const state = { id: container.Id, since: known?.since ?? since, stop: null };
    followed.set(name, state);
    readLogs(name, container.Id, tty, state.since, true, state);
  }

  for (const [name, entry] of followed) {
    if (!running.has(name)) {
      entry.stop?.();
      followed.delete(name);
    }
  }

  if (firstScan) {
    firstScan = false;
    await purge(names);
  }
}

async function loop() {
  try {
    await scan();
  } catch (error) {
    console.error("[logs] scan failed:", error.message);
  }
}

console.log(`[logs] started, keeping ${[...KEEP].join("/")} for ${RETENTION_MS / 3_600_000}h`);
await loop();
setInterval(loop, 15_000);
setInterval(trim, 60_000);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    redis.disconnect();
    process.exit(0);
  });
}
