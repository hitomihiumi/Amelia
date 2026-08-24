import { Client } from "discord.js";
import { prisma } from "../database";
import { ModerationService } from "../helpers/moderation";

/** How often expired punishments are checked. */
const TICK_MS = 60_000;

/** Warns are cheaper to expire in batches, so they run every 10th tick. */
const WARN_EXPIRY_EVERY = 10;

/**
 * Background sweeper for time limited punishments.
 *
 * Mutes rely on the native Discord timeout and expire on their own, so only
 * temporary bans and expiring warns need attention here.
 */
module.exports = (client: Client) => {
  let tick = 0;

  client.on("clientReady", () => {
    setInterval(async () => {
      tick += 1;

      try {
        await expireBans(client);
      } catch (error) {
        console.error("[Moderation] Failed to expire bans:", error);
      }

      if (tick % WARN_EXPIRY_EVERY !== 0) return;

      try {
        await expireWarns(client);
      } catch (error) {
        console.error("[Moderation] Failed to expire warns:", error);
      }
    }, TICK_MS);
  });
};

/** Lift temporary bans whose duration has elapsed. */
async function expireBans(client: Client): Promise<void> {
  const expired = await prisma.moderationCase.findMany({
    where: {
      type: "ban",
      active: true,
      expiresAt: { not: null, lte: new Date() },
    },
    take: 50,
  });

  for (const entry of expired) {
    const guild = client.guilds.cache.get(entry.guildId);

    if (!guild) {
      // The bot is no longer on that server — close the case so it is not retried.
      await prisma.moderationCase.update({
        where: { id: entry.id },
        data: { active: false, revokedAt: new Date(), revokeReason: "bot left the guild" },
      });
      continue;
    }

    const service = new ModerationService(client, guild);

    const result = await service.revoke({
      caseNumber: entry.caseNumber,
      moderatorId: client.user?.id ?? "AUTOMOD",
      reason: "Temporary ban expired",
    });

    if (!result.ok) {
      console.error(`[Moderation] Failed to expire case #${entry.caseNumber}: ${result.error}`);
      // Deactivate anyway so a permanently failing case does not block the queue.
      await prisma.moderationCase.update({
        where: { id: entry.id },
        data: { active: false, revokedAt: new Date(), revokeReason: "expired" },
      });
    }
  }
}

/** Deactivate warns that are older than the guild's warn expiry. */
async function expireWarns(client: Client): Promise<void> {
  const guilds = await prisma.guild.findMany({
    where: { modWarnExpiry: { gt: 0 } },
    select: { id: true, modWarnExpiry: true },
  });

  for (const guild of guilds) {
    const threshold = new Date(Date.now() - guild.modWarnExpiry * 24 * 60 * 60 * 1000);

    await prisma.moderationCase.updateMany({
      where: {
        guildId: guild.id,
        type: "warn",
        active: true,
        createdAt: { lt: threshold },
      },
      data: { active: false, revokedAt: new Date(), revokeReason: "expired" },
    });
  }
}
