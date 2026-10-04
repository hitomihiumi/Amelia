// Ships the warnings and errors of every container on this Docker host into Redis, where the
// dashboard's admin panel reads them (Logs page). Runs as the `logs` service of docker-compose.yml.
//
// - Talks to the Docker Engine API over the unix socket (read-only calls: list, inspect, logs).
// - Keeps only warn/error entries (LOG_SHIPPER_LEVELS), at most LOG_RETENTION_HOURS old.
// - Entries are idempotent: replaying a container's log after a restart does not duplicate them.
import http from "node:http";
import { Redis } from "ioredis";

const SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const RETENTION_MS = Number(process.env.LOG_RETENTION_HOURS || 24) * 3_600_000;
const MAX_ENTRIES = Number(process.env.LOG_MAX_ENTRIES || 20_000);
const MAX_MESSAGE = 4_000;
const KEEP = new Set((process.env.LOG_SHIPPER_LEVELS || "warn,error").split(",").map((s) => s.trim()));
const SELF = process.env.HOSTNAME || "";

/** Same key the dashboard reads. */
export const LOG_KEY = "amelia:logs";

const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
redis.on("error", (error) => console.error("[log-shipper] Redis:", error.message));

/** name -> { stop(), since } for containers that are currently followed. */
const followed = new Map();

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

/** Guess the severity of one line. Docker records only the stream, not a level. */
export function classify(message, stream) {
  // PostgreSQL: "2026-... UTC [1] ERROR:  ...", Redis: "1:M 01 Jan 2026 ... # warning".
  if (/\b(PANIC|FATAL|ERROR):/.test(message)) return "error";
  if (/\bWARNING:/.test(message)) return "warn";
  if (/^\d+:[A-Z] .* # /.test(message)) return "warn";
  if (/\b(unhandled|uncaught|exception|fatal|panic|ECONN\w*|ETIMEDOUT|ENOTFOUND|failed|failure|❌)\b/i.test(message)) return "error";
  if (/\b(warn|warning|deprecated|⚠)\b/i.test(message)) return "warn";
  // Anything on stderr that is not recognised above is most likely a console.error().
  return stream === "stderr" ? "error" : "info";
}

const CONTINUATION = /^(\s+at |\s{2,}\S|Caused by:|\}|\)|\])/;

async function push(entries) {
  if (entries.length === 0) return;
  const pipeline = redis.pipeline();
  for (const entry of entries) pipeline.zadd(LOG_KEY, entry.ts, JSON.stringify(entry));
  await pipeline.exec();
}

async function trim() {
  try {
    await redis.zremrangebyscore(LOG_KEY, "-inf", Date.now() - RETENTION_MS);
    await redis.zremrangebyrank(LOG_KEY, 0, -(MAX_ENTRIES + 1));
  } catch (error) {
    console.error("[log-shipper] trim failed:", error.message);
  }
}

/** Parses Docker's multiplexed log stream (8-byte frame header) or a raw TTY stream. */
function followContainer(name, id, tty, since) {
  const state = followed.get(name);
  let buffer = Buffer.alloc(0);
  let pending = null; // an entry that may still receive stack-trace lines
  let flushTimer = null;

  const flush = () => {
    clearTimeout(flushTimer);
    const entry = pending;
    pending = null;
    if (entry && KEEP.has(entry.level)) push([entry]).catch(() => {});
  };

  const onLine = (stream, line) => {
    // With timestamps=true every line starts with an RFC3339Nano timestamp.
    const space = line.indexOf(" ");
    if (space < 20) return;
    const stamp = line.slice(0, space);
    const ts = Date.parse(stamp);
    if (Number.isNaN(ts)) return;
    state.since = Math.max(state.since, Math.floor(ts / 1000));
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

  const query = `stdout=1&stderr=1&follow=1&timestamps=1&since=${state.since}`;
  docker(`/containers/${id}/logs?${query}`, { stream: true })
    .then(({ req, res }) => {
      state.stop = () => req.destroy();
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
        followed.delete(name);
      };
      res.on("end", end);
      res.on("error", end);
      req.on("error", end);
    })
    .catch((error) => {
      console.error(`[log-shipper] ${name}:`, error.message);
      followed.delete(name);
    });
}

async function scan() {
  const containers = await docker("/containers/json");
  const running = new Set();

  for (const container of containers) {
    const name = (container.Names?.[0] || container.Id).replace(/^\//, "");
    if (container.Id.startsWith(SELF) && SELF) continue; // do not ship our own output back

    running.add(name);
    const known = followed.get(name);
    if (known?.id === container.Id) continue;
    known?.stop?.();

    const details = await docker(`/containers/${container.Id}/json`);
    const since = known?.since ?? Math.floor((Date.now() - RETENTION_MS) / 1000);
    followed.set(name, { id: container.Id, since, stop: null });
    followContainer(name, container.Id, Boolean(details.Config?.Tty), since);
  }

  for (const [name, entry] of followed) {
    if (!running.has(name)) {
      entry.stop?.();
      followed.delete(name);
    }
  }
}

async function loop() {
  try {
    await scan();
  } catch (error) {
    console.error("[log-shipper] scan failed:", error.message);
  }
}

console.log(`[log-shipper] started, keeping ${[...KEEP].join("/")} for ${RETENTION_MS / 3_600_000}h`);
await loop();
setInterval(loop, 15_000);
setInterval(trim, 60_000);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    redis.disconnect();
    process.exit(0);
  });
}
