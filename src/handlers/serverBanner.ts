import { createHash } from "node:crypto";
import { Client, DiscordAPIError, Guild, PermissionFlagsBits } from "discord.js";
import { prisma } from "../database";
import { trackActivity } from "../helpers/banner/activity";
import { normalizeBanner } from "../helpers/banner/normalize";
import { renderBanner } from "../helpers/banner/render";
import { collectBannerStats } from "../helpers/banner/stats";
import { BANNER_LIMITS, BannerErrorCode, BannerStatus } from "../types/helpers";

/** How often the list of servers with a banner is looked through. */
const TICK_MS = 60_000;

/** A server whose banner cannot be set (no boost level, no permission) is retried this rarely. */
const BLOCKED_RETRY_MS = 60 * 60_000;

class BannerError extends Error {
  constructor(
    readonly code: BannerErrorCode,
    message: string,
  ) {
    super(message);
  }
}

let busy = false;

/** The last result is kept even when the picture is not sent again. */
async function saveStatus(guildId: string, status: BannerStatus): Promise<void> {
  await prisma.guild.update({ where: { id: guildId }, data: { bannerStatus: status as object } });
}

function classify(error: unknown): BannerError {
  if (error instanceof BannerError) return error;
  if (error instanceof DiscordAPIError) {
    if (error.code === 50013 || error.code === 50001) {
      return new BannerError("permission", "The bot may not change the server banner");
    }
    // 50035 with a feature message, or 30xxx limits: the server cannot have a banner (yet).
    if (/banner|feature|boost/i.test(error.message)) {
      return new BannerError("boost_tier", error.message);
    }
    return new BannerError("unknown", error.message);
  }
  return new BannerError("unknown", error instanceof Error ? error.message : String(error));
}

async function applyBanner(
  guild: Guild,
  row: {
    bannerActive: string | null;
    bannerItems: unknown;
    bannerActivityWindow: number;
  },
  previous: BannerStatus,
  force: boolean,
): Promise<{ hash: string; uploaded: boolean }> {
  const items = Array.isArray(row.bannerItems) ? row.bannerItems : [];
  const banner = normalizeBanner(items.find((item: any) => item?.id === row.bannerActive));
  if (!banner) throw new BannerError("render", "The selected banner no longer exists");

  if (!guild.features.includes("BANNER")) {
    throw new BannerError("boost_tier", "The server needs boost level 2 to have a banner");
  }
  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
    throw new BannerError("permission", "The bot needs the Manage Server permission");
  }

  const stats = await collectBannerStats(guild, row.bannerActivityWindow);

  let picture: Buffer;
  try {
    picture = await renderBanner(banner, stats, guild.id);
  } catch (error) {
    throw new BannerError("render", error instanceof Error ? error.message : "Render failed");
  }

  const hash = createHash("sha1").update(picture).digest("hex");
  if (!force && hash === previous.hash) return { hash, uploaded: false };

  await guild.setBanner(picture, "Server banner update");
  return { hash, uploaded: true };
}

async function tick(client: Client): Promise<void> {
  if (busy) return;
  busy = true;

  try {
    const rows = await prisma.guild.findMany({
      where: { bannerEnabled: true, bannerActive: { not: null } },
      select: {
        id: true,
        bannerInterval: true,
        bannerActivityWindow: true,
        bannerActive: true,
        bannerItems: true,
        bannerStatus: true,
        bannerRefreshRequest: true,
      },
    });

    const now = Date.now();

    for (const row of rows) {
      const guild = client.guilds.cache.get(row.id);
      if (!guild) continue;

      const status = (row.bannerStatus ?? {}) as BannerStatus;
      const lastRun = status.last_run ? Date.parse(status.last_run) : 0;
      const requested = row.bannerRefreshRequest ? Date.parse(row.bannerRefreshRequest) : 0;
      const refreshRequested = requested > lastRun;

      const interval = Math.min(
        BANNER_LIMITS.maxInterval,
        Math.max(BANNER_LIMITS.minInterval, row.bannerInterval),
      );
      const blocked = status.error_code === "boost_tier" || status.error_code === "permission";
      const wait = blocked ? Math.max(BLOCKED_RETRY_MS, interval * 60_000) : interval * 60_000;

      if (!refreshRequested && now - lastRun < wait) continue;

      try {
        const { hash } = await applyBanner(guild, row, status, refreshRequested);
        const stamp = new Date().toISOString();
        await saveStatus(row.id, {
          last_run: stamp,
          last_ok: stamp,
          error: null,
          error_code: null,
          hash,
        });
      } catch (raw) {
        const error = classify(raw);
        console.error(`[Banner] ${guild.id}: ${error.message}`);
        await saveStatus(row.id, {
          ...status,
          last_run: new Date().toISOString(),
          error: error.message.slice(0, 300),
          error_code: error.code,
        }).catch(() => {});
      }
    }
  } finally {
    busy = false;
  }
}

/**
 * Keeps the banner of every server that turned the feature on up to date: draws the active banner
 * with fresh statistics and sets it as the server banner. Also counts messages per member for
 * the "most active member" of a banner.
 */
module.exports = (client: Client) => {
  trackActivity(client);

  client.on("clientReady", () => {
    setInterval(
      () => tick(client).catch((error) => console.error("[Banner] Update failed:", error)),
      TICK_MS,
    ).unref?.();
  });
};
