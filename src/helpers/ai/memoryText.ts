import { AI_MEMORY_MAX_LENGTH } from "../../types/helpers";

/**
 * Pure text helpers of the long-term memory: the markers the model writes at the end of an
 * answer, what is not worth (or not safe) keeping, and how alike two notes are.
 */

export interface ParsedMarkers {
  /** The answer without the markers. */
  text: string;
  /** Facts the model wants to keep. */
  remember: string[];
  /** Facts the model was asked to drop. */
  forget: string[];
}

const MARKER = /\[\[\s*(remember|forget)\s*:\s*([\s\S]*?)\s*\]\]/gi;
/** A marker cut off by the token limit: nothing after it is part of the answer. */
const UNFINISHED_MARKER = /\[\[\s*(?:remember|forget)\b[\s\S]*$/i;

/** Take `[[remember: …]]` and `[[forget: …]]` out of an answer. */
export function extractMarkers(raw: string): ParsedMarkers {
  const remember: string[] = [];
  const forget: string[] = [];

  const withoutMarkers = raw.replace(MARKER, (_match, kind: string, value: string) => {
    (kind.toLowerCase() === "remember" ? remember : forget).push(value);
    return "";
  });

  return {
    text: withoutMarkers.replace(UNFINISHED_MARKER, "").trim(),
    remember,
    forget,
  };
}

/** One line, no list bullet, no stray quotes, cut to the length a memory may have. */
export function normalizeMemory(text: string): string {
  const flat = text
    .replace(/\s+/g, " ")
    .replace(/^[\s\-*•"'`«»]+|[\s"'`«»]+$/g, "")
    .trim();
  return flat.length > AI_MEMORY_MAX_LENGTH ? `${flat.slice(0, AI_MEMORY_MAX_LENGTH - 1)}…` : flat;
}

/** `\b` knows only ASCII letters, so word starts are found with a Unicode look-behind. */
const wordStart = (alternatives: string[]) =>
  new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join("|")})`, "iu");

const SECRET_WORDS = wordStart([
  "password",
  "passwd",
  "passcode",
  "token",
  "api[\\s_-]?key",
  "secret",
  "cvv",
  "iban",
  "парол",
  "токен",
  "секретн",
  "паспорт",
  "номер карт",
  "пін",
]);

/** Wording that tries to steer the bot rather than describe a person. */
const STEERING = wordStart([
  "ignore (?:all |any |the )?(?:previous|prior|above)",
  "system prompt",
  "from now on",
  "you (?:must|should|will) (?:always|never)",
  "always (?:answer|reply|respond)",
  "never (?:answer|reply|refuse)",
  "jailbreak",
  "developer mode",
  "игнорируй",
  "с этого момента",
  "всегда отвечай",
  "системный промпт",
  "ігноруй",
  "відтепер",
]);

/**
 * Why a note must not be kept, or `null` when it may be. Contact details, credentials, links
 * and anything that reads as an instruction to the bot are refused, whatever the model decided.
 */
export function rejectMemory(text: string): "short" | "private" | "steering" | null {
  if (text.length < 6) return "short";
  if (
    /[\w.+-]+@[\w-]+\.[\w.]+/.test(text) ||
    /https?:\/\/|discord\.gg\/|www\./i.test(text) ||
    /(?:\+?\d[\s().-]*){7,}/.test(text) ||
    /\b[A-Za-z0-9_-]{28,}\b/.test(text) ||
    /<@[!&]?\d+>|@everyone|@here/.test(text) ||
    SECRET_WORDS.test(text)
  ) {
    return "private";
  }
  if (STEERING.test(text)) return "steering";
  return null;
}

/** Lower-case words of three letters or more, the unit notes are compared by. */
export function words(text: string): Set<string> {
  const found = text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  return new Set(found);
}

/** Share of words two notes have in common, 0 to 1. */
export function similarity(a: string, b: string): number {
  const left = words(a);
  const right = words(b);
  if (left.size === 0 || right.size === 0) return 0;

  let shared = 0;
  for (const word of left) if (right.has(word)) shared++;
  return shared / (left.size + right.size - shared);
}

/** Notes this alike are the same note, said again. */
export const SAME_MEMORY = 0.7;
/** How alike a "forget that …" must be to a stored note to remove it. */
export const FORGET_MATCH = 0.4;
