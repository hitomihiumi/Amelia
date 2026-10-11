import { Guild } from "discord.js";
import { prisma } from "../../database";
import { BannerStats } from "../../types/helpers";
import { topActive } from "./activity";

function startOfDay(daysAgo = 0): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo));
}

/**
 * Members who are not offline. Discord counts them for every server, so the privileged presence
 * intent is not needed; the cache is the fallback when the request fails.
 */
async function onlineMembers(guild: Guild): Promise<number> {
  try {
    const fresh = await guild.client.guilds.fetch({
      guild: guild.id,
      withCounts: true,
      force: true,
    });
    if (typeof fresh.approximatePresenceCount === "number") return fresh.approximatePresenceCount;
  } catch {
    // Fall through to the cache.
  }
  return guild.presences.cache.filter((presence) => presence.status !== "offline").size;
}

/** The member who wrote the most over the window, skipping anyone who has left the server. */
async function mostActive(guild: Guild, minutes: number): Promise<BannerStats["top"]> {
  const candidates = await topActive(guild.id, minutes);

  for (const candidate of candidates) {
    const member = await guild.members.fetch(candidate.userId).catch(() => null);
    if (!member || member.user.bot) continue;
    return {
      name: member.displayName,
      avatar: member.displayAvatarURL({ size: 256, extension: "png", forceStatic: true }),
      messages: candidate.messages,
    };
  }
  return null;
}

/** Collects the numbers a banner can show. */
export async function collectBannerStats(
  guild: Guild,
  activityWindow: number,
): Promise<BannerStats> {
  const [today, week, online, top] = await Promise.all([
    prisma.guildStat.findUnique({
      where: { guildId_day: { guildId: guild.id, day: startOfDay() } },
    }),
    prisma.guildStat.aggregate({
      where: { guildId: guild.id, day: { gte: startOfDay(6) } },
      _sum: { messages: true },
    }),
    onlineMembers(guild),
    mostActive(guild, activityWindow),
  ]);

  return {
    guild_name: guild.name,
    guild_icon: guild.iconURL({ size: 512, extension: "png", forceStatic: true }) ?? "",
    members: guild.memberCount,
    members_online: online,
    voice_members: guild.voiceStates.cache.filter(
      (state) => state.channelId && !state.member?.user.bot,
    ).size,
    boosts: guild.premiumSubscriptionCount ?? 0,
    boost_tier: Number(guild.premiumTier),
    messages_today: today?.messages ?? 0,
    messages_week: week._sum.messages ?? 0,
    joins_today: today?.joins ?? 0,
    leaves_today: today?.leaves ?? 0,
    channels: guild.channels.cache.size,
    roles: Math.max(0, guild.roles.cache.size - 1),
    top,
  };
}
