import { RedisService } from "../../database/redis";
import type { AiLimits } from "../../types/helpers";
import { AI_BUSY_LOCK_SECONDS, AI_QUOTA, type AiModelKey } from "./config";

/**
 * Rate limits of the AI chat, all kept in Redis so they hold across shards:
 *
 *  - per member: requests per minute and per day (set by the server),
 *  - per server: requests per day (set by the server),
 *  - per model: requests per minute, requests per day and tokens per minute of the
 *    free API key. These are shared by every server, which is what keeps the bot
 *    from burning the whole key on one busy community.
 *
 * Counters are fixed windows. A request is checked against every counter of a group
 * and counted on all of them in one Lua call, so a request refused by one limit
 * never uses up the others.
 */

export type LimitScope = "user_minute" | "user_day" | "guild_day";

export interface LimitRefusal {
  scope: LimitScope;
  /** Seconds until the counter resets. */
  retryAfter: number;
}

const PREFIX = "ai";

const CONSUME_SCRIPT = `
for i = 1, #KEYS do
  local current = tonumber(redis.call('GET', KEYS[i]) or '0')
  if current >= tonumber(ARGV[2 * i - 1]) then
    return {i, redis.call('TTL', KEYS[i])}
  end
end
for i = 1, #KEYS do
  local n = redis.call('INCR', KEYS[i])
  if n == 1 then
    redis.call('EXPIRE', KEYS[i], tonumber(ARGV[2 * i]))
  end
end
return {0, 0}
`;

/** Decrement without going below zero, used to give a counted request back. */
const REFUND_SCRIPT = `
for i = 1, #KEYS do
  local current = tonumber(redis.call('GET', KEYS[i]) or '0')
  if current > 0 then
    redis.call('DECR', KEYS[i])
  end
end
return 1
`;

function redis() {
  return RedisService.getClient();
}

function minuteBucket(now = Date.now()): number {
  return Math.floor(now / 60000);
}

function utcDay(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Google resets the daily quota of a free key at midnight Pacific time. */
function pacificDay(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

function secondsToNextMinute(now = Date.now()): number {
  return 60 - Math.floor((now % 60000) / 1000);
}

function secondsToUtcMidnight(now = Date.now()): number {
  return 86400 - Math.floor((now % 86400000) / 1000);
}

interface Counter {
  key: string;
  limit: number;
  ttl: number;
}

async function consume(counters: Counter[]): Promise<number> {
  const args: (string | number)[] = [];
  for (const counter of counters) args.push(counter.limit, counter.ttl);

  const [index] = (await redis().eval(
    CONSUME_SCRIPT,
    counters.length,
    ...counters.map((counter) => counter.key),
    ...args,
  )) as [number, number];

  return index;
}

async function refund(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis().eval(REFUND_SCRIPT, keys.length, ...keys);
}

// ── Member and server limits ────────────────────────────────────────────────────

export interface UserSlot {
  /** Hand the request back, when it never reached the model. */
  refund: () => Promise<void>;
}

function userKeys(guildId: string, userId: string) {
  return {
    minute: `${PREFIX}:rl:user:${guildId}:${userId}:m:${minuteBucket()}`,
    day: `${PREFIX}:rl:user:${guildId}:${userId}:d:${utcDay()}`,
    guild: `${PREFIX}:rl:guild:${guildId}:d:${utcDay()}`,
  };
}

/**
 * Count one request of a member against the limits of their server.
 * Returns the limit that refused it, or a slot to refund when the request fails.
 */
export async function takeUserSlot(
  guildId: string,
  userId: string,
  limits: AiLimits,
): Promise<{ slot: UserSlot } | { refusal: LimitRefusal }> {
  const keys = userKeys(guildId, userId);
  const scopes: LimitScope[] = ["user_minute", "user_day", "guild_day"];
  const counters: Counter[] = [
    { key: keys.minute, limit: limits.user_per_minute, ttl: 70 },
    { key: keys.day, limit: limits.user_per_day, ttl: 90000 },
    { key: keys.guild, limit: limits.guild_per_day, ttl: 90000 },
  ];

  const blocked = await consume(counters);
  if (blocked > 0) {
    const scope = scopes[blocked - 1];
    // Windows are aligned to the clock: the minute counter restarts with the next minute,
    // the daily ones with the UTC date — their keys outlive the window a little.
    const retryAfter = scope === "user_minute" ? secondsToNextMinute() : secondsToUtcMidnight();
    return { refusal: { scope, retryAfter } };
  }

  return {
    slot: { refund: () => refund(counters.map((counter) => counter.key)) },
  };
}

export interface UsageSnapshot {
  user_minute: { used: number; limit: number };
  user_day: { used: number; limit: number };
  guild_day: { used: number; limit: number };
}

/** Current usage, for the `/ai usage` command. */
export async function getUsage(
  guildId: string,
  userId: string,
  limits: AiLimits,
): Promise<UsageSnapshot> {
  const keys = userKeys(guildId, userId);
  const [minute, day, guild] = await redis().mget(keys.minute, keys.day, keys.guild);

  return {
    user_minute: { used: Number(minute ?? 0), limit: limits.user_per_minute },
    user_day: { used: Number(day ?? 0), limit: limits.user_per_day },
    guild_day: { used: Number(guild ?? 0), limit: limits.guild_per_day },
  };
}

// ── One request at a time per member ────────────────────────────────────────────

function busyKey(guildId: string, userId: string) {
  return `${PREFIX}:busy:${guildId}:${userId}`;
}

/** Take the member's lock. False while a previous request of theirs is still running. */
export async function lockUser(guildId: string, userId: string): Promise<boolean> {
  const result = await redis().set(busyKey(guildId, userId), "1", "EX", AI_BUSY_LOCK_SECONDS, "NX");
  return result === "OK";
}

export async function unlockUser(guildId: string, userId: string): Promise<void> {
  await redis().del(busyKey(guildId, userId));
}

// ── Notices ─────────────────────────────────────────────────────────────────────

/**
 * Throttle for the "slow down" replies, so a member who keeps hitting the limit
 * gets one answer per window instead of a wall of them.
 */
export async function shouldNotify(scopeKey: string, seconds = 20): Promise<boolean> {
  const result = await redis().set(`${PREFIX}:notice:${scopeKey}`, "1", "EX", seconds, "NX");
  return result === "OK";
}

// ── Quota of the API key ────────────────────────────────────────────────────────

function modelKeys(model: AiModelKey) {
  return {
    minute: `${PREFIX}:rl:model:${model}:m:${minuteBucket()}`,
    tokens: `${PREFIX}:rl:model:${model}:t:${minuteBucket()}`,
    day: `${PREFIX}:rl:model:${model}:d:${pacificDay()}`,
    cooldown: `${PREFIX}:model:${model}:cooldown`,
  };
}

export interface ModelSlot {
  refund: () => Promise<void>;
}

/**
 * Reserve one request on a model. Refused when the model is cooling down after a
 * 429 from the API, or when the key's per-minute, per-day or token budget is spent.
 */
export async function takeModelSlot(model: AiModelKey): Promise<ModelSlot | null> {
  const keys = modelKeys(model);

  if (await redis().exists(keys.cooldown)) return null;

  const tokens = Number((await redis().get(keys.tokens)) ?? 0);
  if (tokens >= AI_QUOTA.tokensPerMinute) return null;

  const counters: Counter[] = [
    { key: keys.minute, limit: AI_QUOTA.requestsPerMinute, ttl: 70 },
    { key: keys.day, limit: AI_QUOTA.requestsPerDay, ttl: 90000 },
  ];
  if ((await consume(counters)) > 0) return null;

  return { refund: () => refund(counters.map((counter) => counter.key)) };
}

/** Add the tokens a finished request used to the model's per-minute budget. */
export async function recordTokens(model: AiModelKey, tokens: number): Promise<void> {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  const { tokens: key } = modelKeys(model);
  await redis().multi().incrby(key, Math.round(tokens)).expire(key, 70).exec();
}

/** The API said 429: stop sending to this model for a while, on every shard. */
export async function coolDownModel(model: AiModelKey, seconds: number): Promise<void> {
  const ttl = Math.min(Math.max(Math.ceil(seconds), 5), 3600);
  await redis().set(modelKeys(model).cooldown, "1", "EX", ttl);
}
