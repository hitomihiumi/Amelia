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

/** The models behind the choices above. */
export type AiModelKey = "31b" | "26b";

export const AI_MODEL_KEYS: AiModelKey[] = ["31b", "26b"];

export interface AiLimits {
  /** Messages one member can send to the AI per minute. */
  user_per_minute: number;
  /** Messages one member can send to the AI per day. */
  user_per_day: number;
  /** Messages the whole server can send to the AI per day. */
  guild_per_day: number;
}

/** What the AI may do beyond answering the message in front of it. */
export interface AiOptions {
  /** Keep the last exchanges of a channel for a while, so replies follow the conversation. */
  short_term: boolean;
  /** Remember lasting things members say about themselves, across days. */
  long_term: boolean;
  /** Look at images attached to messages. */
  images: boolean;
}

export const DEFAULT_AI_OPTIONS: AiOptions = { short_term: true, long_term: true, images: true };

/** Read stored options, with anything missing or not a boolean taken from the defaults. */
export function normalizeAiOptions(raw: unknown): AiOptions {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const pick = (key: keyof AiOptions) =>
    typeof source[key] === "boolean" ? (source[key] as boolean) : DEFAULT_AI_OPTIONS[key];
  return { short_term: pick("short_term"), long_term: pick("long_term"), images: pick("images") };
}

/** Most things the AI keeps about one member of a server; the least useful go first. */
export const AI_MEMORY_MAX_PER_USER = 30;
/** Longest single memory, in characters. */
export const AI_MEMORY_MAX_LENGTH = 160;

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
  options: AiOptions;
}

export const AI_PERSONA_MAX_LENGTH = 1500;

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
  options: DEFAULT_AI_OPTIONS,
};

// ── Premium ─────────────────────────────────────────────────────────────────────

/**
 * Premium access of a server. The AI chat is a premium feature; for now the
 * administrators of the bot hand premium out by hand from the admin panel.
 */
export interface PremiumSettings {
  enabled: boolean;
  /** When premium ends. `null` means it does not expire. */
  until: Date | null;
  /** Why and to whom it was given, for the administrators only. */
  note: string | null;
}

export const DEFAULT_PREMIUM: PremiumSettings = { enabled: false, until: null, note: null };

/** Premium counts while it is switched on and, if it has an end, that end is still ahead. */
export function isPremiumActive(
  premium: Partial<PremiumSettings> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!premium?.enabled) return false;
  if (!premium.until) return true;
  return new Date(premium.until).getTime() > now.getTime();
}

// ── Global configuration (admin panel) ──────────────────────────────────────────

/** What the API key allows one model to do, as the bot is told to stay within. */
export interface AiModelQuota {
  /** Requests per minute. */
  rpm: number;
  /** Requests per day. */
  rpd: number;
  /** Tokens per minute. */
  tpm: number;
}

/**
 * Set by the bot's administrators and shared by every server:
 * the quota of the API key per model, and the highest limits a server may give itself.
 */
export interface AiGlobalConfig {
  quota: Record<AiModelKey, AiModelQuota>;
  /** Ceiling for the limits a server sets for itself. */
  caps: AiLimits;
}

/** Both models of the free key allow 14,400 requests a day and 10 a minute. */
export const DEFAULT_AI_QUOTA: AiModelQuota = { rpm: 10, rpd: 14400, tpm: 15000 };

export const DEFAULT_AI_CAPS: AiLimits = {
  user_per_minute: 20,
  user_per_day: 500,
  guild_per_day: 5000,
};

export const DEFAULT_AI_GLOBAL_CONFIG: AiGlobalConfig = {
  quota: { "31b": { ...DEFAULT_AI_QUOTA }, "26b": { ...DEFAULT_AI_QUOTA } },
  caps: { ...DEFAULT_AI_CAPS },
};

/** What an administrator can type into the quota fields. */
export const AI_QUOTA_BOUNDS: Record<keyof AiModelQuota, { min: number; max: number }> = {
  rpm: { min: 1, max: 10000 },
  rpd: { min: 1, max: 10000000 },
  tpm: { min: 1, max: 100000000 },
};

/** What an administrator can set the ceilings to. */
export const AI_CAP_BOUNDS: Record<keyof AiLimits, { min: number; max: number }> = {
  user_per_minute: { min: 1, max: 100 },
  user_per_day: { min: 1, max: 5000 },
  guild_per_day: { min: 1, max: 100000 },
};

/** Range a server may pick a limit from, under the ceilings of the administrators. */
export function limitBounds(caps: AiLimits): Record<keyof AiLimits, { min: number; max: number }> {
  return {
    user_per_minute: { min: 1, max: Math.max(1, caps.user_per_minute) },
    user_per_day: { min: 1, max: Math.max(1, caps.user_per_day) },
    guild_per_day: { min: 1, max: Math.max(1, caps.guild_per_day) },
  };
}

/** A server's limits, brought down to the ceilings where they go over. */
export function clampLimits(limits: AiLimits, caps: AiLimits): AiLimits {
  return {
    user_per_minute: Math.min(limits.user_per_minute, caps.user_per_minute),
    user_per_day: Math.min(limits.user_per_day, caps.user_per_day),
    guild_per_day: Math.min(limits.guild_per_day, caps.guild_per_day),
  };
}

/**
 * Read a stored global configuration, filling in whatever is missing or out of range
 * with `fallback` (the environment's numbers, or the defaults).
 */
export function normalizeGlobalConfig(
  raw: { quota?: unknown; caps?: unknown } | null | undefined,
  fallback: AiGlobalConfig = DEFAULT_AI_GLOBAL_CONFIG,
): AiGlobalConfig {
  const pick = <T extends object>(
    source: unknown,
    base: T,
    bounds: Record<keyof T, { min: number; max: number }>,
  ): T => {
    const out = { ...base };
    if (!source || typeof source !== "object") return out;
    for (const key of Object.keys(base) as (keyof T)[]) {
      const value = (source as Record<string, unknown>)[key as string];
      const { min, max } = bounds[key];
      if (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max) {
        out[key] = value as T[keyof T];
      }
    }
    return out;
  };

  const quota = (raw?.quota && typeof raw.quota === "object" ? raw.quota : {}) as Record<
    string,
    unknown
  >;

  return {
    quota: {
      "31b": pick(quota["31b"], fallback.quota["31b"], AI_QUOTA_BOUNDS),
      "26b": pick(quota["26b"], fallback.quota["26b"], AI_QUOTA_BOUNDS),
    },
    caps: pick(raw?.caps, fallback.caps, AI_CAP_BOUNDS),
  };
}
