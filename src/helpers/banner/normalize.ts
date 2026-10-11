import {
  BANNER_FONTS,
  BANNER_HEIGHT,
  BANNER_LIMITS,
  BANNER_WIDTH,
  BannerBackground,
  BannerFont,
  BannerLayer,
  BannerMetric,
  ServerBanner,
} from "../../types/helpers";

/**
 * The banners are written by the dashboard, but they come out of a JSON column and are drawn on
 * the bot's machine, so everything is checked and clamped here before it reaches the canvas.
 */

const COLOR =
  /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))$/i;
const METRICS: readonly BannerMetric[] = [
  "members",
  "members_online",
  "voice_members",
  "boosts",
  "messages_today",
];

function num(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === "string" && COLOR.test(value.trim()) ? value.trim() : fallback;
}

function text(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

function font(value: unknown): BannerFont {
  return BANNER_FONTS.includes(value as BannerFont) ? (value as BannerFont) : BANNER_FONTS[0];
}

function background(raw: any): BannerBackground {
  switch (raw?.type) {
    case "gradient":
      return {
        type: "gradient",
        from: color(raw.from, "#1b1f3b"),
        to: color(raw.to, "#3a1c71"),
        angle: num(raw.angle, 0, 360, 135),
      };
    case "image":
      return {
        type: "image",
        src: text(raw.src, BANNER_LIMITS.url),
        dim: num(raw.dim, 0, 100, 40),
        blur: num(raw.blur, 0, 40, 0),
        color: color(raw.color, "#000000"),
      };
    default:
      return { type: "color", color: color(raw?.color, "#1b1f3b") };
  }
}

function layer(raw: any, index: number): BannerLayer | null {
  if (!raw || typeof raw !== "object") return null;

  const base = {
    id: text(raw.id, 64, `layer-${index}`) || `layer-${index}`,
    name: text(raw.name, BANNER_LIMITS.name),
    x: num(raw.x, -BANNER_WIDTH, BANNER_WIDTH * 2, 0),
    y: num(raw.y, -BANNER_HEIGHT, BANNER_HEIGHT * 2, 0),
    width: num(raw.width, 1, BANNER_WIDTH * 2, 100),
    height: num(raw.height, 1, BANNER_HEIGHT * 2, 100),
    opacity: num(raw.opacity, 0, 100, 100),
    visible: raw.visible !== false,
  };

  switch (raw.type) {
    case "text":
      return {
        ...base,
        type: "text",
        text: text(raw.text, BANNER_LIMITS.text),
        font: font(raw.font),
        size: num(raw.size, 4, 400, 32),
        color: color(raw.color, "#ffffff"),
        align: ["left", "center", "right"].includes(raw.align) ? raw.align : "left",
        shadow: raw.shadow === true,
      };
    case "shape":
      return {
        ...base,
        type: "shape",
        color: color(raw.color, "#ffffff"),
        radius: num(raw.radius, 0, 2000, 0),
        stroke_color: raw.stroke_color ? color(raw.stroke_color, "#ffffff") : null,
        stroke_width: num(raw.stroke_width, 0, 50, 0),
      };
    case "image":
      return {
        ...base,
        type: "image",
        src: text(raw.src, BANNER_LIMITS.url),
        radius: num(raw.radius, 0, 2000, 0),
      };
    case "avatar":
      return {
        ...base,
        type: "avatar",
        source: raw.source === "top_member" ? "top_member" : "guild_icon",
        radius: num(raw.radius, 0, 2000, 2000),
        border_color: color(raw.border_color, "#ffffff"),
        border_width: num(raw.border_width, 0, 50, 0),
      };
    case "progress":
      return {
        ...base,
        type: "progress",
        metric: METRICS.includes(raw.metric) ? raw.metric : "members",
        goal: num(raw.goal, 1, 100_000_000, 1000),
        color: color(raw.color, "#7c5cff"),
        track_color: color(raw.track_color, "rgba(255,255,255,0.15)"),
        radius: num(raw.radius, 0, 2000, 2000),
      };
    default:
      return null;
  }
}

export function normalizeBanner(raw: any): ServerBanner | null {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string") return null;

  const layers = Array.isArray(raw.layers) ? raw.layers : [];
  return {
    id: raw.id.slice(0, 64),
    name: text(raw.name, BANNER_LIMITS.name),
    timezone: validTimezone(raw.timezone) ? raw.timezone : "UTC",
    background: background(raw.background),
    layers: layers
      .slice(0, BANNER_LIMITS.layers)
      .map(layer)
      .filter((item: BannerLayer | null): item is BannerLayer => item !== null),
  };
}

export function validTimezone(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
