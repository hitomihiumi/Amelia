/**
 * Server banners: a picture with live statistics that the bot sets as the banner of the server.
 *
 * The same shapes live in the dashboard (`src/lib/db/types/Banner.ts`), which edits them. A banner
 * is plain data: a background and a list of layers, each one placed on the 960×540 canvas.
 */

export const BANNER_WIDTH = 960;
export const BANNER_HEIGHT = 540;

export const BANNER_LIMITS = {
  items: 1,
  layers: 40,
  text: 300,
  name: 60,
  url: 2048,
  /** Minutes between two updates; Discord rate limits changes of the server banner. */
  minInterval: 10,
  maxInterval: 1440,
} as const;

/** Fonts the bot and the dashboard preview both have. */
export const BANNER_FONTS = ["WDXL Lubrifont", "Geist Mono"] as const;
export type BannerFont = (typeof BANNER_FONTS)[number];

/** Minutes the "most active member" can be counted over. */
export const BANNER_ACTIVITY_WINDOWS = [60, 120] as const;

export type BannerBackground =
  | { type: "color"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | {
      type: "image";
      src: string;
      /** 0-100: how much of the picture is covered by `color`. */
      dim: number;
      /** Blur radius in pixels. */
      blur: number;
      color: string;
    };

interface BannerLayerBase {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 0-100 */
  opacity: number;
  visible: boolean;
}

export interface BannerTextLayer extends BannerLayerBase {
  type: "text";
  /** Placeholders such as `{members}` are filled in on every update. */
  text: string;
  font: BannerFont;
  size: number;
  color: string;
  align: "left" | "center" | "right";
  shadow: boolean;
}

/** A filled rectangle; a radius of half its shorter side makes a pill or a circle. */
export interface BannerShapeLayer extends BannerLayerBase {
  type: "shape";
  color: string;
  radius: number;
  stroke_color: string | null;
  stroke_width: number;
}

export interface BannerImageLayer extends BannerLayerBase {
  type: "image";
  /** A link; placeholders such as `{guild.icon}` and `{top.avatar}` work here too. */
  src: string;
  radius: number;
}

export interface BannerAvatarLayer extends BannerLayerBase {
  type: "avatar";
  source: "guild_icon" | "top_member";
  radius: number;
  border_color: string;
  border_width: number;
}

/** A bar that fills as a statistic approaches a goal. */
export type BannerMetric =
  | "members"
  | "members_online"
  | "voice_members"
  | "boosts"
  | "messages_today";

export interface BannerProgressLayer extends BannerLayerBase {
  type: "progress";
  metric: BannerMetric;
  goal: number;
  color: string;
  track_color: string;
  radius: number;
}

export type BannerLayer =
  | BannerTextLayer
  | BannerShapeLayer
  | BannerImageLayer
  | BannerAvatarLayer
  | BannerProgressLayer;

export interface ServerBanner {
  id: string;
  name: string;
  /** IANA time zone `{time}` and `{date}` are shown in. */
  timezone: string;
  background: BannerBackground;
  layers: BannerLayer[];
}

export type BannerErrorCode = "boost_tier" | "permission" | "render" | "unknown";

/** Written by the bot after each update, shown by the dashboard. */
export interface BannerStatus {
  last_run?: string | null;
  last_ok?: string | null;
  error?: string | null;
  error_code?: BannerErrorCode | null;
  /** Hash of the last picture that was uploaded, so an unchanged picture is not sent again. */
  hash?: string | null;
}

export interface BannerSettings {
  enabled: boolean;
  /** Minutes between updates. */
  interval: number;
  /** Minutes the most active member is counted over: 60 or 120. */
  activity_window: number;
  /** Id of the banner in `items` that is put on the server. */
  active: string | null;
  items: ServerBanner[];
  status: BannerStatus;
  /** ISO time set by the dashboard: update the banner now. */
  refresh_request: string | null;
}

/** The numbers a banner shows. */
export interface BannerStats {
  guild_name: string;
  guild_icon: string;
  members: number;
  members_online: number;
  voice_members: number;
  boosts: number;
  boost_tier: number;
  messages_today: number;
  messages_week: number;
  joins_today: number;
  leaves_today: number;
  channels: number;
  roles: number;
  top: { name: string; avatar: string; messages: number } | null;
}

/** Placeholders usable in the text of a banner, and the statistic each one stands for. */
export const BANNER_PLACEHOLDERS = [
  "guild.name",
  "guild.icon",
  "members",
  "members.online",
  "voice.members",
  "boosts",
  "boost.tier",
  "messages.today",
  "messages.week",
  "joins.today",
  "leaves.today",
  "channels",
  "roles",
  "top.name",
  "top.avatar",
  "top.messages",
  "date",
  "time",
] as const;
