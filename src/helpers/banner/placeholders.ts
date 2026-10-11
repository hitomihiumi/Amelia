import { BannerMetric, BannerStats } from "../../types/helpers";

/**
 * Date and time in the banner's time zone, written the same way the dashboard preview writes them
 * (`DD.MM.YYYY` and `HH:mm`), so what is previewed is what is drawn.
 */
export function bannerClock(timezone: string, now = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("day")}.${get("month")}.${get("year")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** The statistic a progress bar follows. */
export function metricValue(stats: BannerStats, metric: BannerMetric): number {
  switch (metric) {
    case "members_online":
      return stats.members_online;
    case "voice_members":
      return stats.voice_members;
    case "boosts":
      return stats.boosts;
    case "messages_today":
      return stats.messages_today;
    default:
      return stats.members;
  }
}

/** Fills the `{members}`-style placeholders of a banner text. Unknown ones stay as typed. */
export function fillBannerText(text: string, stats: BannerStats, timezone: string): string {
  if (!text) return text;
  const clock = bannerClock(timezone);
  const values: Record<string, string> = {
    "guild.name": stats.guild_name,
    "guild.icon": stats.guild_icon,
    members: String(stats.members),
    "members.online": String(stats.members_online),
    "voice.members": String(stats.voice_members),
    boosts: String(stats.boosts),
    "boost.tier": String(stats.boost_tier),
    "messages.today": String(stats.messages_today),
    "messages.week": String(stats.messages_week),
    "joins.today": String(stats.joins_today),
    "leaves.today": String(stats.leaves_today),
    channels: String(stats.channels),
    roles: String(stats.roles),
    "top.name": stats.top?.name ?? "—",
    "top.avatar": stats.top?.avatar ?? "",
    "top.messages": String(stats.top?.messages ?? 0),
    date: clock.date,
    time: clock.time,
  };

  // One pass, so a value that itself contains "{members}" is never filled in a second time.
  return text.replace(/\{([a-z.]+)\}/g, (match, key: string) => values[key] ?? match);
}
