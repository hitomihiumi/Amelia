import { prisma } from "../../database/prisma";
import {
  type AiGlobalConfig,
  DEFAULT_AI_CAPS,
  isPremiumActive,
  normalizeGlobalConfig,
  type PremiumSettings,
} from "../../types/helpers";
import { ENV_QUOTA } from "./config";

/**
 * The AI limits administrators set from the admin panel, kept in the single `AiConfig` row.
 * Missing or invalid numbers fall back to the environment's, so the bot works before anyone
 * has opened the panel.
 */

const CACHE_MS = 30_000;

const ENV_CONFIG: AiGlobalConfig = {
  quota: { "31b": { ...ENV_QUOTA }, "26b": { ...ENV_QUOTA } },
  caps: { ...DEFAULT_AI_CAPS },
};

let cached: { at: number; value: AiGlobalConfig } | null = null;

/** Global AI configuration. Cached for 30 seconds; a failed read keeps the last known values. */
export async function getAiConfig(): Promise<AiGlobalConfig> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  try {
    const row = await prisma.aiConfig.findUnique({ where: { id: "global" } });
    const value = normalizeGlobalConfig(row, ENV_CONFIG);
    cached = { at: Date.now(), value };
    return value;
  } catch (error) {
    console.error("[AI] Could not read the global AI configuration:".red, error);
    return cached?.value ?? ENV_CONFIG;
  }
}

/** Forget the cached configuration, so the next request reads the database again. */
export function invalidateAiConfig(): void {
  cached = null;
}

/** Premium access of a server, straight from the database. */
export async function getPremium(guildId: string): Promise<PremiumSettings> {
  const row = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { premium: true, premiumUntil: true, premiumNote: true },
  });

  return {
    enabled: row?.premium ?? false,
    until: row?.premiumUntil ?? null,
    note: row?.premiumNote ?? null,
  };
}

/** Whether the server may use the AI chat right now. */
export async function hasAiAccess(guildId: string): Promise<boolean> {
  return isPremiumActive(await getPremium(guildId));
}
