import { Client, Message } from "discord.js";
import { RedisService } from "../../database";

/**
 * Who wrote the most in the last hour or two, for the "most active member" of a banner.
 *
 * Messages are counted in ten minute buckets (one Redis sorted set per server and bucket), so a
 * window of 60 or 120 minutes is the sum of the last 6 or 12 buckets. The counts are collected in
 * memory and written every half minute, so a busy server costs a few commands a minute.
 */

const BUCKET_MS = 10 * 60_000;
const KEEP_SECONDS = 3 * 3600;
const FLUSH_MS = 30_000;

let pending = new Map<string, Map<string, number>>();

const bucketOf = (time = Date.now()) => Math.floor(time / BUCKET_MS);
const keyOf = (guildId: string, bucket: number) => `banner:activity:${guildId}:${bucket}`;

export function recordActivity(guildId: string, userId: string): void {
  const key = keyOf(guildId, bucketOf());
  let users = pending.get(key);
  if (!users) {
    users = new Map();
    pending.set(key, users);
  }
  users.set(userId, (users.get(userId) ?? 0) + 1);
}

export async function flushActivity(): Promise<void> {
  if (pending.size === 0) return;

  const batch = pending;
  pending = new Map();

  try {
    const pipeline = RedisService.getClient().pipeline();
    for (const [key, users] of batch) {
      for (const [userId, count] of users) pipeline.zincrby(key, count, userId);
      pipeline.expire(key, KEEP_SECONDS);
    }
    await pipeline.exec();
  } catch (error) {
    console.error("[Banner] Failed to save the activity, keeping it for the next try:", error);
    // Put the numbers back, so a Redis hiccup does not lose them.
    for (const [key, users] of batch) {
      const back = pending.get(key) ?? new Map<string, number>();
      for (const [userId, count] of users) back.set(userId, (back.get(userId) ?? 0) + count);
      pending.set(key, back);
    }
  }
}

/** The members who wrote the most over the last `minutes`, best first. */
export async function topActive(
  guildId: string,
  minutes: number,
  limit = 5,
): Promise<Array<{ userId: string; messages: number }>> {
  await flushActivity();

  const buckets = Math.max(1, Math.round(minutes / 10));
  const current = bucketOf();
  const keys: string[] = [];
  for (let i = 0; i < buckets; i++) keys.push(keyOf(guildId, current - i));

  const redis = RedisService.getClient();
  const target = `banner:activity:merge:${guildId}`;

  const results = await redis
    .multi()
    .zunionstore(target, keys.length, ...keys)
    .zrevrange(target, 0, limit - 1, "WITHSCORES")
    .del(target)
    .exec();

  const flat = (results?.[1]?.[1] ?? []) as string[];
  const top: Array<{ userId: string; messages: number }> = [];
  for (let i = 0; i < flat.length; i += 2) {
    top.push({ userId: flat[i], messages: Number(flat[i + 1]) });
  }
  return top;
}

/** Starts counting the messages of every server. */
export function trackActivity(client: Client): void {
  client.on("messageCreate", (message: Message) => {
    if (!message.guildId || message.author.bot || message.webhookId) return;
    recordActivity(message.guildId, message.author.id);
  });
  setInterval(() => void flushActivity(), FLUSH_MS).unref?.();
}
