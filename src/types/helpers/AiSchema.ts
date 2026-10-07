/**
 * AI chat types.
 *
 * These types are mirrored in the dashboard repository
 * (`src/lib/db/types/Ai.ts`) — keep both copies in sync.
 */

/**
 * Which Gemma 4 model answers: `auto` prefers the 31B model and falls back to the
 * 26B one when the first is out of quota or unavailable.
 */
export type AiModelChoice = "auto" | "31b" | "26b";

export const AI_MODEL_CHOICES: AiModelChoice[] = ["auto", "31b", "26b"];

export interface AiLimits {
  /** Messages one member can send to the AI per minute. */
  user_per_minute: number;
  /** Messages one member can send to the AI per day. */
  user_per_day: number;
  /** Messages the whole server can send to the AI per day. */
  guild_per_day: number;
}

export interface AiSettings {
  enabled: boolean;
  /** Chat channels: the bot answers every message there. Elsewhere it answers mentions and replies. */
  channels: string[];
  /** Channels the bot never answers in. */
  ignore_channels: string[];
  model: AiModelChoice;
  /** Extra instructions of the server, appended to the bot's own personality. */
  persona: string | null;
  limits: AiLimits;
}

export const AI_PERSONA_MAX_LENGTH = 1500;

/** Bounds a server owner can set the limits to. */
export const AI_LIMIT_BOUNDS: Record<keyof AiLimits, { min: number; max: number }> = {
  user_per_minute: { min: 1, max: 20 },
  user_per_day: { min: 1, max: 500 },
  guild_per_day: { min: 1, max: 5000 },
};

export const DEFAULT_AI_LIMITS: AiLimits = {
  user_per_minute: 3,
  user_per_day: 40,
  guild_per_day: 400,
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  channels: [],
  ignore_channels: [],
  model: "auto",
  persona: null,
  limits: DEFAULT_AI_LIMITS,
};
