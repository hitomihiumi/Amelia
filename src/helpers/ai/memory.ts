import { RedisService } from "../../database/redis";
import { AI_MAX_INPUT_CHARS, AI_MEMORY_TTL_SECONDS, AI_MEMORY_TURNS } from "./config";
import type { AiTurn } from "./gemini";

/**
 * Short conversation memory, one per channel: the last few exchanges, so a reply
 * can refer to what was said a minute ago. It expires on its own and is never
 * written to the database. Only answered exchanges are stored.
 */

const key = (channelId: string) => `ai:mem:${channelId}`;

/** Messages the bot sent as AI answers, to tell a reply to the AI from a reply to a command. */
const replyKey = (messageId: string) => `ai:reply:${messageId}`;
const REPLY_TTL_SECONDS = 24 * 60 * 60;

export function clip(text: string, max = AI_MAX_INPUT_CHARS): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** User turns carry the author's name so a channel with several people stays readable. */
export function userTurn(name: string, text: string): AiTurn {
  return { role: "user", text: `${name}: ${clip(text)}` };
}

export async function loadMemory(channelId: string): Promise<AiTurn[]> {
  const raw = await RedisService.getClient().lrange(key(channelId), 0, -1);
  const turns: AiTurn[] = [];
  for (const entry of raw) {
    try {
      const turn = JSON.parse(entry) as AiTurn;
      if ((turn.role === "user" || turn.role === "model") && typeof turn.text === "string") {
        turns.push(turn);
      }
    } catch {
      // A damaged entry is dropped, the rest of the conversation still counts.
    }
  }
  return turns;
}

export async function remember(channelId: string, user: AiTurn, answer: string): Promise<void> {
  const redis = RedisService.getClient();
  const entries = [user, { role: "model", text: clip(answer) } satisfies AiTurn].map((turn) =>
    JSON.stringify(turn),
  );

  await redis
    .multi()
    .rpush(key(channelId), ...entries)
    .ltrim(key(channelId), -AI_MEMORY_TURNS, -1)
    .expire(key(channelId), AI_MEMORY_TTL_SECONDS)
    .exec();
}

export async function forget(channelId: string): Promise<void> {
  await RedisService.getClient().del(key(channelId));
}

export async function markAiReply(messageId: string): Promise<void> {
  await RedisService.getClient().set(replyKey(messageId), "1", "EX", REPLY_TTL_SECONDS);
}

export async function isAiReply(messageId: string): Promise<boolean> {
  return (await RedisService.getClient().exists(replyKey(messageId))) === 1;
}
