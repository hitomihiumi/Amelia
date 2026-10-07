import type { AiModelChoice, AiModelKey, AiModelQuota } from "../../types/helpers";

/**
 * AI chat runs on Gemma 4 through the Gemini API with a free Google AI Studio key.
 *
 * Model ids come from the environment so a renamed model needs no code change. The quota
 * numbers are the bot's own ceiling, kept at or under what the key really allows. They are
 * edited in the admin panel (see `globalConfig.ts`); the environment only supplies the
 * numbers used until an administrator has saved some.
 */

export type { AiModelKey };

export interface AiModel {
  key: AiModelKey;
  /** Model id in the Gemini API. */
  id: string;
  label: string;
}

function envInt(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const AI_MODELS: Record<AiModelKey, AiModel> = {
  "31b": {
    key: "31b",
    id: process.env.AI_MODEL_31B || "gemma-4-31b-it",
    label: "Gemma 4 31B",
  },
  "26b": {
    key: "26b",
    id: process.env.AI_MODEL_26B || "gemma-4-26b-a4b-it",
    label: "Gemma 4 26B",
  },
};

/** Models to try for a server's choice, best first. */
export function modelOrder(choice: AiModelChoice): AiModel[] {
  if (choice === "31b") return [AI_MODELS["31b"]];
  if (choice === "26b") return [AI_MODELS["26b"]];
  return [AI_MODELS["31b"], AI_MODELS["26b"]];
}

/**
 * Quota of the API key per model, used until the admin panel has saved one. Both Gemma 4
 * models of the free key allow 14,400 requests a day.
 */
export const ENV_QUOTA: AiModelQuota = {
  rpm: envInt("AI_MODEL_RPM", 15),
  rpd: envInt("AI_MODEL_RPD", 14400),
  tpm: envInt("AI_MODEL_TPM", 15000),
};

export const AI_API_BASE =
  process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

/** The AI is off, whatever the server settings say, until a key is set. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Seconds before the same member can start another request while one is still running. */
export const AI_BUSY_LOCK_SECONDS = 90;

/** Turns of the conversation kept per channel, and for how long. */
export const AI_MEMORY_TURNS = 12;
export const AI_MEMORY_TTL_SECONDS = 30 * 60;
/** Longest message kept in the conversation memory and sent to the model. */
export const AI_MAX_INPUT_CHARS = 1500;

export const AI_MAX_OUTPUT_TOKENS = envInt("AI_MAX_OUTPUT_TOKENS", 700);
export const AI_REQUEST_TIMEOUT_MS = envInt("AI_REQUEST_TIMEOUT_MS", 45000);
