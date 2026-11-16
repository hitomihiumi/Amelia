import type { Client } from "discord.js";
import {
  AI_CAP_BOUNDS,
  AI_PERSONA_MAX_LENGTH,
  AUDIT_CATEGORIES,
  AUDIT_EVENT_KEYS,
  AUTOMOD_KINDS,
  type AutoModerationSettings,
  BANNER_ACTIVITY_WINDOWS,
  BANNER_LIMITS,
  DEFAULT_AI_LIMITS,
  DEFAULT_AI_OPTIONS,
  DEFAULT_APPEAL_FORM,
  DEFAULT_REPORT_FORM,
  type Manifest,
} from "../../../types/helpers";
import { applyAutoModeration } from "../../../handlers/autoModeration";
import { generateID } from "../../../handlers/functions";
import { normalizeLevelMessage } from "../../levelAnnouncement";
import { AUTOMOD_LIMITS, validateAutoModeration } from "../../moderation/autoModeration";
import { getAiConfig } from "../globalConfig";
import {
  bool,
  channel,
  coerce,
  type Coerced,
  describe,
  fill,
  hexColor,
  int,
  line,
  list,
  map,
  obj,
  oneOf,
  parseLoose,
  pretty,
  role,
  sameItem,
  show,
  type Spec,
  text,
} from "./spec";
import type { GuildStore, SettingOp, SettingOpKind, ToolContext } from "./types";

/**
 * Every setting the AI may read and change, by the same path the rest of the bot uses with
 * `guild.get` and `guild.set`. A setting that is not listed here cannot be touched: premium, the
 * case counters and the ids of the AutoMod rules are left out on purpose.
 */

interface Entry {
  /** Path of a stored field. Deeper keys (`ai.limits.user_per_day`) are resolved inside it. */
  key: string;
  spec: Spec;
  /** A short hint for the model, only where the key does not say it all. */
  note?: string;
  /** What old rows that never had the field are read as. */
  def?: unknown;
  /** Bring the stored value into its complete form. */
  read?: (raw: unknown) => unknown;
  /** Last check or adjustment of the whole value once a change was applied to it. */
  finish?: (value: any, ctx: ToolContext) => Coerced;
  /** Other paths that are written together with this one. */
  also?: (value: any) => Record<string, unknown>;
}

/** The settings as they will be once the queued changes are applied. */
interface View {
  get(key: string): Promise<any>;
}

interface Section {
  id: string;
  title: string;
  entries: Entry[];
  /** Advice for the model, shown under the list. */
  note?: string;
  /** Rules that span several settings. Returns what is wrong, or null. */
  check?: (view: View, ctx: ToolContext) => Promise<string | null> | string | null;
  /** Whether a change of these settings means Discord's AutoMod rules have to be brought in line. */
  syncsAutoMod?: (touched: Set<string>) => boolean;
}

/** A picture link, or a placeholder the bot turns into one. */
const pictureLink: Spec = {
  t: "str",
  max: 2048,
  nullable: true,
  pattern: /^(https?:\/\/\S+|\{[\w.]+\})$/i,
  hint: "http(s) link or placeholder",
};

const embedText = obj({
  title: text(256),
  description: text(4096),
  color: hexColor,
  thumbnail: pictureLink,
  image: pictureLink,
  footer: text(2048),
});

const punishment = obj({
  type: oneOf("warn", "mute", "kick", "ban"),
  time: int(0, AUTOMOD_LIMITS.timeoutSeconds),
  reason: line(400),
});

const autoModBase = {
  enabled: bool,
  ignore_channels: list(channel("any", false), 50),
  ignore_roles: list(role(false), 20),
  delete_message: bool,
  block_message: text(AUTOMOD_LIMITS.blockMessage),
  alert_channel: channel("text"),
  moderation_immune: bool,
  punishment,
};

/** The invite and link filters keep every field in a column of its own. */
function autoModColumns(kind: "invite" | "links"): Entry[] {
  return Object.entries(autoModBase).map(([field, spec]) => ({
    key: `moderation.auto_moderation.${kind}.${field}`,
    spec,
  }));
}

const formSpec = obj({
  enabled: bool,
  channel: channel("text"),
  cooldown: int(0, 2_592_000),
  max_pending: int(1, 20),
  allow_anonymous: bool,
  require_target: bool,
  allow_banned: bool,
  fields: list(
    obj({
      id: line(64),
      label: text(100, false, 1),
      description: text(200),
      type: oneOf(
        "short",
        "paragraph",
        "number",
        "boolean",
        "select",
        "user",
        "channel",
        "message_link",
        "url",
      ),
      required: bool,
      placeholder: text(100),
      min: int(0, 4000, true),
      max: int(0, 4000, true),
      options: list(
        obj({ id: line(64), label: text(100, false, 1), value: text(100, false, 1) }),
        25,
        "value",
      ),
    }),
    15,
    "id",
  ),
  success_message: text(1000),
  approve_message: text(1000),
  reject_message: text(1000),
});

/** Fields and options the model left without an id get one, and ids must not repeat. */
function finishForm(value: any): Coerced {
  const seen = new Set<string>();
  for (const field of value.fields ?? []) {
    if (!field.id) field.id = generateID();
    if (seen.has(field.id))
      return { ok: false, error: `two form fields share the id "${field.id}"` };
    seen.add(field.id);
    for (const option of field.options ?? []) {
      if (!option.id) option.id = generateID();
    }
    if (field.type === "select" && (field.options ?? []).length === 0) {
      return { ok: false, error: `the select field "${field.label}" needs at least one option` };
    }
  }
  if (value.enabled && !value.channel) {
    return { ok: false, error: "an enabled form needs a channel for its submissions" };
  }
  return { ok: true, value };
}

const CUSTOM_EMOJI = /^<(a?):(\w{2,32}):(\d{17,20})>$/;

/** A currency sign: an emoji of this server (by name or as `<:name:id>`) or a unicode emoji. */
function finishCurrency(value: string | null, ctx: ToolContext): Coerced {
  if (value === null) return { ok: true, value: null };

  const custom = CUSTOM_EMOJI.exec(value);
  const emojis = ctx.discordGuild.emojis.cache;
  const found = custom
    ? emojis.get(custom[3])
    : emojis.find((emoji) => emoji.name?.toLowerCase() === value.replace(/:/g, "").toLowerCase());

  if (found) {
    return { ok: true, value: `<${found.animated ? "a" : ""}:${found.name}:${found.id}>` };
  }
  if (custom) return { ok: false, error: "that custom emoji is not from this server" };
  if (/\p{Extended_Pictographic}/u.test(value) && value.length <= 16) return { ok: true, value };
  return {
    ok: false,
    error: "expected a unicode emoji or the name of an emoji of this server",
  };
}

/** Names a command permission can be stored under: commands, groups and their subcommands. */
export function commandNames(client: Client): string[] {
  const names = new Set<string>();
  for (const [name, command] of client.holder.cmds.slashCommands) {
    names.add(String(name));
    const group = command as unknown as Manifest;
    if (group?.commands && typeof group.commands === "object") {
      for (const sub of Object.keys(group.commands)) names.add(sub);
    }
  }
  return [...names].sort();
}

function finishPermissions(value: Record<string, any>, ctx: ToolContext): Coerced {
  const known = new Set(commandNames(ctx.client));
  for (const [name, entry] of Object.entries(value)) {
    if (!known.has(name)) {
      return {
        ok: false,
        error: `there is no command "${name}"; use find with type "command" for the names`,
      };
    }
    entry.name ??= name;
    entry.permission ??= null;
  }
  return { ok: true, value };
}

async function ruleOf(view: View, kind: (typeof AUTOMOD_KINDS)[number]): Promise<any> {
  if (kind !== "invite" && kind !== "links") {
    return view.get(`moderation.auto_moderation.${kind}`);
  }
  const rule: Record<string, unknown> = {};
  for (const field of Object.keys(autoModBase)) {
    rule[field] = await view.get(`moderation.auto_moderation.${kind}.${field}`);
  }
  if (kind === "links")
    rule.ignore_links = await view.get("moderation.auto_moderation.links.ignore_links");
  return rule;
}

/** Bring Discord's AutoMod rules in line and say what it refused. */
async function syncAutoMod(ctx: ToolContext): Promise<string[]> {
  try {
    const result = await applyAutoModeration(ctx.client, ctx.discordGuild);
    if (!result) return [];
    if (result.listError) {
      return [
        `AutoMod: Discord did not let me read the rules (${result.listError.message}). I need the Manage Server permission.`,
      ];
    }
    const notes: string[] = [];
    for (const kind of AUTOMOD_KINDS) {
      const outcome = result.results[kind];
      if (outcome.error) notes.push(`AutoMod ${kind}: ${outcome.error.message}`);
      for (const warning of outcome.warnings) notes.push(`AutoMod ${kind}: ${warning.code}`);
    }
    return notes;
  } catch (error) {
    console.error("[AI] AutoMod sync failed:".red, error);
    return ["AutoMod: the rules could not be synced with Discord."];
  }
}

function incomeRange(label: string, range: any): string | null {
  const percent = range.type === "percentage";
  if (range.min > (percent ? 99 : 10000)) return `${label}.min is too high for type ${range.type}`;
  if (range.max > (percent ? 100 : 100000))
    return `${label}.max is too high for type ${range.type}`;
  if (range.min >= range.max) return `${label}.min must be below ${label}.max`;
  return null;
}

const amount = int(1, 1_000_000);
const aiChannels = list(channel("text", false), 25);

export const SECTIONS: Section[] = [
  {
    id: "general",
    title: "Prefix and language of the bot",
    entries: [
      { key: "settings.prefix", spec: text(5, false, 1) },
      { key: "settings.language", spec: oneOf("en", "ru", "uk") },
    ],
  },
  {
    id: "ai",
    title: "AI chat (you)",
    entries: [
      { key: "ai.enabled", spec: bool },
      { key: "ai.channels", spec: aiChannels, note: "you answer every message there" },
      { key: "ai.ignore_channels", spec: aiChannels, note: "you never answer there" },
      { key: "ai.model", spec: oneOf("auto", "31b", "26b") },
      {
        key: "ai.persona",
        spec: text(AI_PERSONA_MAX_LENGTH),
        note: "extra instructions for your tone",
      },
      {
        key: "ai.limits",
        def: DEFAULT_AI_LIMITS,
        spec: obj({
          user_per_minute: int(1, AI_CAP_BOUNDS.user_per_minute.max),
          user_per_day: int(1, AI_CAP_BOUNDS.user_per_day.max),
          guild_per_day: int(1, AI_CAP_BOUNDS.guild_per_day.max),
        }),
      },
      {
        key: "ai.options",
        def: DEFAULT_AI_OPTIONS,
        spec: obj({ short_term: bool, long_term: bool, images: bool, code: bool, actions: bool }),
        note: "actions = these tools; switching it off ends this ability",
      },
    ],
    check: async (view) => {
      const limits = await view.get("ai.limits");
      const { caps } = await getAiConfig();
      for (const key of ["user_per_minute", "user_per_day", "guild_per_day"] as const) {
        if (limits[key] > caps[key]) {
          return `ai.limits.${key} can be at most ${caps[key]} (set by the bot's administrators)`;
        }
      }
      return null;
    },
  },
  {
    id: "levels",
    title: "Levels: XP for messages, level roles, the level-up announcement",
    entries: [
      { key: "utils.levels.enabled", spec: bool },
      { key: "utils.levels.ignore_channels", spec: list(channel("any", false), 50) },
      { key: "utils.levels.ignore_roles", spec: list(role(false), 50) },
      {
        key: "utils.levels.level_roles",
        spec: map(int(1, 1000), role(false), 50),
        note: "level → role given at that level",
      },
      { key: "utils.levels.message.enabled", spec: bool },
      {
        key: "utils.levels.message.channel",
        spec: channel("text"),
        note: "null = where the member wrote",
      },
      { key: "utils.levels.message.delete", spec: int(0, 60), note: "seconds, 0 keeps it" },
      {
        key: "utils.levels.message.content",
        spec: obj({ text: text(2000), embed: embedText, card: bool, reply: bool }),
        read: (raw) => normalizeLevelMessage(raw),
        note: "placeholders: {user.mention} {user.name} {level} {xp} {messages}",
      },
      { key: "economy.income.level_up.enabled", spec: bool },
      { key: "economy.income.level_up.amount", spec: int(0, 1_000_000), note: "coins per level" },
    ],
    check: async (view) => {
      const content = await view.get("utils.levels.message.content");
      const embed = content.embed ?? {};
      if (!content.text && !content.card && !embed.title && !embed.description) {
        return "the level-up announcement needs a text, an embed title or description, or the card";
      }
      return null;
    },
  },
  {
    id: "economy",
    title: "Economy: currency sign and ways to earn",
    entries: [
      {
        key: "economy.currency.emoji",
        spec: text(80),
        finish: finishCurrency,
        also: (value: string | null) => ({
          "economy.currency.id": value ? (CUSTOM_EMOJI.exec(value)?.[3] ?? null) : null,
        }),
        note: "unicode emoji or the name of a server emoji; null = default",
      },
      { key: "economy.income.work.enabled", spec: bool },
      { key: "economy.income.work.cooldown", spec: int(1, 86400), note: "seconds" },
      { key: "economy.income.work.min", spec: int(1, 10000) },
      { key: "economy.income.work.max", spec: int(1, 100000) },
      { key: "economy.income.timely.enabled", spec: bool },
      { key: "economy.income.timely.amount", spec: amount },
      { key: "economy.income.daily.enabled", spec: bool },
      { key: "economy.income.daily.amount", spec: amount },
      { key: "economy.income.weekly.enabled", spec: bool },
      { key: "economy.income.weekly.amount", spec: amount },
      { key: "economy.income.bump.enabled", spec: bool },
      { key: "economy.income.bump.amount", spec: amount },
      { key: "economy.income.rob.enabled", spec: bool },
      { key: "economy.income.rob.cooldown", spec: int(1, 86400), note: "seconds" },
      {
        key: "economy.income.rob.income",
        spec: obj({ min: int(1, 100000), max: int(1, 100000), type: oneOf("percentage", "fixed") }),
      },
      {
        key: "economy.income.rob.punishment",
        spec: obj({
          min: int(1, 100000),
          max: int(1, 100000),
          type: oneOf("percentage", "fixed"),
          fail_chance: int(5, 95),
        }),
      },
      { key: "economy.income.slots.enabled", spec: bool },
      { key: "economy.income.slots.min_bet", spec: int(1, 100_000) },
      { key: "economy.income.slots.max_bet", spec: int(1, 100_000) },
      { key: "economy.income.slots.cooldown", spec: int(1, 3600), note: "seconds" },
    ],
    check: async (view) => {
      if (
        (await view.get("economy.income.work.min")) >= (await view.get("economy.income.work.max"))
      ) {
        return "economy.income.work.min must be below economy.income.work.max";
      }
      if (
        (await view.get("economy.income.slots.min_bet")) >
        (await view.get("economy.income.slots.max_bet"))
      ) {
        return "economy.income.slots.min_bet cannot be above max_bet";
      }
      return (
        incomeRange("economy.income.rob.income", await view.get("economy.income.rob.income")) ??
        incomeRange(
          "economy.income.rob.punishment",
          await view.get("economy.income.rob.punishment"),
        )
      );
    },
  },
  {
    id: "shop",
    title: "Role shop",
    entries: [
      {
        key: "economy.shop.roles",
        spec: list(
          obj({
            role: role(false),
            price: int(1, 999_999),
            discount: obj({
              amount: int(0, 100),
              starts_at: int(0, 9_999_999_999_999, true),
              expires_at: int(0, 9_999_999_999_999, true),
            }),
          }),
          25,
          "role",
        ),
        note: "op add/remove with one item; discount.amount in percent, times are Unix milliseconds or null",
      },
    ],
    check: async (view) => {
      for (const item of (await view.get("economy.shop.roles")) as any[]) {
        const { starts_at: from, expires_at: until } = item.discount ?? {};
        if (from && until && from >= until) return "a discount must start before it ends";
      }
      return null;
    },
  },
  {
    id: "voice",
    title: "Private voice rooms (join to create)",
    entries: [
      { key: "utils.join_to_create.enabled", spec: bool },
      {
        key: "utils.join_to_create.channel",
        spec: channel("voice"),
        note: "the channel members join",
      },
      {
        key: "utils.join_to_create.category",
        spec: channel("category"),
        note: "where rooms are created",
      },
      { key: "utils.join_to_create.default_name", spec: text(100, false, 1) },
    ],
    check: async (view) => {
      if (!(await view.get("utils.join_to_create.enabled"))) return null;
      if (!(await view.get("utils.join_to_create.channel")))
        return "private rooms need a voice channel";
      if (!(await view.get("utils.join_to_create.category")))
        return "private rooms need a category";
      return null;
    },
  },
  {
    id: "moderation",
    title: "Moderation: moderator roles, log, warn escalation",
    entries: [
      { key: "moderation.moderation_roles", spec: list(role(false), 25) },
      { key: "moderation.log_channel", spec: channel("text") },
      { key: "moderation.dm_notify", spec: bool, note: "DM the member about a punishment" },
      { key: "moderation.warn_expiry", spec: int(0, 365), note: "days, 0 = never" },
      {
        key: "moderation.warn_thresholds",
        spec: list(obj({ count: int(1, 100), punishment }), 10, "count"),
        note: "at `count` active warns apply the punishment; time in seconds, 0 = permanent",
      },
    ],
    // The moderator roles are exempt from the rules, so the rules follow them.
    syncsAutoMod: (touched) => touched.has("moderation.moderation_roles"),
  },
  {
    id: "automod",
    title:
      "Auto moderation (Discord AutoMod rules): invite, links, keywords, profanity, mention_spam, spam",
    entries: [
      ...autoModColumns("invite"),
      ...autoModColumns("links"),
      {
        key: "moderation.auto_moderation.links.ignore_links",
        spec: list(text(400, false, 1), 1000),
        note: "allowed links, e.g. youtube.com",
      },
      {
        key: "moderation.auto_moderation.keywords",
        spec: obj({
          ...autoModBase,
          keywords: list(text(AUTOMOD_LIMITS.keywordLength, false, 1), AUTOMOD_LIMITS.keywords),
          regex: list(text(AUTOMOD_LIMITS.regexLength, false, 1), AUTOMOD_LIMITS.regex),
          allow: list(text(AUTOMOD_LIMITS.keywordLength, false, 1), AUTOMOD_LIMITS.allow),
        }),
        note: "`*` at the start or end of a keyword is a wildcard",
      },
      {
        key: "moderation.auto_moderation.profanity",
        spec: obj({
          ...autoModBase,
          presets: list(oneOf("profanity", "sexual_content", "slurs"), 3),
          allow: list(text(AUTOMOD_LIMITS.keywordLength, false, 1), AUTOMOD_LIMITS.allow),
        }),
      },
      {
        key: "moderation.auto_moderation.mention_spam",
        def: { limit: 5 },
        spec: obj({
          ...autoModBase,
          limit: int(1, AUTOMOD_LIMITS.mentionLimit),
          raid_protection: bool,
        }),
      },
      { key: "moderation.auto_moderation.spam", spec: obj(autoModBase) },
    ],
    note: "punishment.time is seconds (0 = permanent). A mute is done by Discord itself for invite, links and keywords.",
    check: async (view) => {
      const settings: Record<string, unknown> = { rules: {} };
      for (const kind of AUTOMOD_KINDS) settings[kind] = await ruleOf(view, kind);
      const [issue] = validateAutoModeration(settings as unknown as AutoModerationSettings);
      if (!issue) return null;
      return `automod ${issue.kind}: ${issue.code}${issue.params ? ` ${JSON.stringify(issue.params)}` : ""}`;
    },
    syncsAutoMod: () => true,
  },
  {
    id: "forms",
    title: "Report and appeal forms of the dashboard",
    entries: [
      {
        key: "moderation.forms.report",
        spec: formSpec,
        def: DEFAULT_REPORT_FORM,
        finish: finishForm,
      },
      {
        key: "moderation.forms.appeal",
        spec: formSpec,
        def: DEFAULT_APPEAL_FORM,
        finish: finishForm,
      },
    ],
    note: "cooldown in seconds. Change the questions with op add/remove on `.fields`.",
  },
  {
    id: "audit",
    title: "Audit log of server events",
    entries: [
      { key: "audit.enabled", spec: bool },
      { key: "audit.channel", spec: channel("text"), note: "default channel" },
      { key: "audit.ignore_channels", spec: list(channel("any", false), 50) },
      { key: "audit.ignore_roles", spec: list(role(false), 50) },
      { key: "audit.ignore_bots", spec: bool },
      { key: "audit.webhook.name", spec: text(80) },
      { key: "audit.webhook.avatar", spec: pictureLink },
      {
        key: "audit.categories",
        spec: map(
          oneOf(...AUDIT_CATEGORIES),
          obj({ channel: channel("text") }),
          AUDIT_CATEGORIES.length,
        ),
        note: "a channel per category",
      },
      {
        key: "audit.events",
        spec: map(
          oneOf(...AUDIT_EVENT_KEYS),
          obj({ enabled: bool, channel: channel("text") }),
          AUDIT_EVENT_KEYS.length,
          () => ({ enabled: true, channel: null }),
        ),
        note: "an event that is not listed is on; set audit.events.<event>.enabled or .channel",
      },
    ],
    check: async (view) =>
      (await view.get("audit.enabled")) && !(await view.get("audit.channel"))
        ? "the audit log needs a default channel (audit.channel)"
        : null,
  },
  {
    id: "games",
    title: "Find-a-team panel",
    entries: [
      { key: "utils.find_team.enabled", spec: bool },
      { key: "utils.find_team.channel", spec: channel("text"), note: "where the panel is" },
      {
        key: "utils.find_team.send_channel",
        spec: channel("text"),
        note: "where requests are posted",
      },
      { key: "utils.find_team.select_placeholder", spec: text(150) },
      { key: "utils.find_team.embed", spec: embedText },
    ],
    note: "The list of games and posting the panel are done with /setting games or in the dashboard.",
  },
  {
    id: "banners",
    title: "Server banner with live statistics",
    entries: [
      { key: "utils.banners.enabled", spec: bool },
      {
        key: "utils.banners.interval",
        spec: int(BANNER_LIMITS.minInterval, BANNER_LIMITS.maxInterval),
        note: "minutes between updates",
      },
      { key: "utils.banners.activity_window", spec: oneOf(...BANNER_ACTIVITY_WINDOWS) },
    ],
    note: "The banner itself is drawn in the dashboard.",
    check: async (view) =>
      (await view.get("utils.banners.enabled")) && !(await view.get("utils.banners.active"))
        ? "there is no banner yet: it has to be created in the dashboard first"
        : null,
  },
  {
    id: "permissions",
    title: "Which roles may use which command",
    entries: [
      {
        key: "permissions.commands",
        spec: map(
          text(32, false, 1),
          obj(
            { roles: list(obj({ id: role(false), type: oneOf("allow", "deny") }), 100, "id") },
            true,
          ),
          300,
          () => ({ roles: [] }),
        ),
        finish: finishPermissions,
        note: "set permissions.commands.<command>.roles with op add/remove; find type=command lists the names",
      },
    ],
  },
];

export const SECTION_IDS = SECTIONS.map((section) => section.id);

/** One line for the system prompt: what can be configured at all. */
export const SECTION_SUMMARY = SECTIONS.map((section) => `${section.id} (${section.title})`).join(
  "; ",
);

const ENTRIES = SECTIONS.flatMap((section) => section.entries.map((entry) => ({ entry, section })));

function locate(key: string): { entry: Entry; section: Section; path: string[] } | null {
  let best: (typeof ENTRIES)[number] | null = null;
  for (const candidate of ENTRIES) {
    const { key: entryKey } = candidate.entry;
    if (key !== entryKey && !key.startsWith(`${entryKey}.`)) continue;
    if (!best || entryKey.length > best.entry.key.length) best = candidate;
  }
  if (!best) return null;
  const rest = key.slice(best.entry.key.length + 1);
  return { ...best, path: rest ? rest.split(".") : [] };
}

/** The stored settings, one top-level branch per query. */
class Snapshot {
  private branches = new Map<string, any>();
  constructor(private guild: GuildStore) {}

  async read(path: string): Promise<any> {
    const [top, ...rest] = path.split(".");
    if (!this.branches.has(top)) this.branches.set(top, (await this.guild.get(top)) ?? {});
    let node = this.branches.get(top);
    for (const key of rest) node = node?.[key];
    return node;
  }

  async entry(entry: Entry): Promise<unknown> {
    const raw = await this.read(entry.key);
    return entry.read ? entry.read(raw) : fill(entry.spec, raw, entry.def);
  }
}

type Updated =
  | {
      ok: true;
      /** The whole value of the node with the change applied. */
      value: unknown;
      /** Description of the node the change landed on, and its value before and after. */
      spec: Spec;
      before: unknown;
      after: unknown;
      /** The operand in its stored form, to replay the change when it is confirmed. */
      sent: unknown;
    }
  | { ok: false; error: string };

/** Items a list operation names; an item with an id field may be given by that id alone. */
function listOperand(
  spec: Extract<Spec, { t: "list" }>,
  raw: unknown,
  ctx: ToolContext,
  where: string,
  op: SettingOpKind,
): Coerced {
  const parsed = parseLoose(raw);
  const items = Array.isArray(parsed) ? parsed : [parsed];

  if (op === "remove" && spec.idKey && spec.of.t === "obj") {
    const idSpec = spec.of.fields[spec.idKey];
    const out: unknown[] = [];
    for (const item of items) {
      const bare = item && typeof item === "object" ? (item as any)[spec.idKey] : item;
      const result = coerce(idSpec, bare, ctx.discordGuild, `${where}.${spec.idKey}`);
      if (!result.ok) return result;
      out.push({ [spec.idKey]: result.value });
    }
    return { ok: true, value: out };
  }

  return coerce({ ...spec, max: Number.MAX_SAFE_INTEGER }, items, ctx.discordGuild, where);
}

/** Apply one change somewhere inside a value, without touching the original. */
function update(
  spec: Spec,
  current: unknown,
  path: string[],
  op: SettingOpKind,
  raw: unknown,
  ctx: ToolContext,
  where: string,
): Updated {
  const guild = ctx.discordGuild;

  if (path.length > 0) {
    const [head, ...rest] = path;

    if (spec.t === "obj") {
      const field = spec.fields[head];
      if (!field) {
        return {
          ok: false,
          error: `${where}: no field "${head}"; fields: ${Object.keys(spec.fields).join(", ")}`,
        };
      }
      const source = (current && typeof current === "object" ? current : {}) as Record<
        string,
        unknown
      >;
      const child = update(field, source[head], rest, op, raw, ctx, where);
      return child.ok ? { ...child, value: { ...source, [head]: child.value } } : child;
    }

    if (spec.t === "map") {
      const keyResult = coerce(spec.key, head, guild, `${where} (key "${head}")`);
      if (!keyResult.ok) return keyResult;
      const key = String(keyResult.value);
      const source = (current && typeof current === "object" ? current : {}) as Record<
        string,
        unknown
      >;

      if (rest.length === 0 && op === "remove") {
        const { [key]: removed, ...others } = source;
        return {
          ok: true,
          value: others,
          spec: spec.value,
          before: removed,
          after: null,
          sent: null,
        };
      }

      const exists = key in source;
      if (!exists && Object.keys(source).length >= spec.max) {
        return { ok: false, error: `${where}: at most ${spec.max} entries` };
      }
      const start = exists ? source[key] : spec.fresh ? fill(spec.value, spec.fresh()) : undefined;
      const child = update(spec.value, start, rest, op, raw, ctx, where);
      if (!child.ok) return child;
      return {
        ...child,
        before: exists ? child.before : null,
        value: { ...source, [key]: child.value },
      };
    }

    return {
      ok: false,
      error:
        spec.t === "list"
          ? `${where}: address the whole list and use op "add" or "remove"`
          : `${where}: there is nothing below this setting`,
    };
  }

  if (op === "set") {
    const result = coerce(spec, raw, guild, where, current);
    return result.ok
      ? {
          ok: true,
          value: result.value,
          spec,
          before: current,
          after: result.value,
          sent: result.value,
        }
      : result;
  }

  if (spec.t === "list") {
    const operand = listOperand(spec, raw, ctx, where, op);
    if (!operand.ok) return operand;
    const items = operand.value as unknown[];
    const existing = Array.isArray(current) ? current : [];

    const next =
      op === "add"
        ? [...existing.filter((old) => !items.some((item) => sameItem(spec, old, item))), ...items]
        : existing.filter((old) => !items.some((item) => sameItem(spec, old, item)));

    if (next.length > spec.max) return { ok: false, error: `${where}: at most ${spec.max} items` };
    // What goes into the confirmation is what was added or removed, not the whole list.
    const changed =
      op === "add"
        ? items
        : existing.filter((old) => items.some((item) => sameItem(spec, old, item)));
    return { ok: true, value: next, spec, before: existing, after: changed, sent: items };
  }

  if (spec.t === "map") {
    const source = (current && typeof current === "object" ? current : {}) as Record<
      string,
      unknown
    >;

    if (op === "add") {
      const result = coerce({ ...spec, max: Number.MAX_SAFE_INTEGER }, raw, guild, where, source);
      if (!result.ok) return result;
      const next = { ...source, ...(result.value as object) };
      if (Object.keys(next).length > spec.max)
        return { ok: false, error: `${where}: at most ${spec.max} entries` };
      return {
        ok: true,
        value: next,
        spec,
        before: source,
        after: result.value,
        sent: result.value,
      };
    }

    const parsed = parseLoose(raw);
    const keys: string[] = [];
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
      const result = coerce(spec.key, item, guild, `${where} (key)`);
      if (!result.ok) return result;
      keys.push(String(result.value));
    }
    const next = Object.fromEntries(Object.entries(source).filter(([key]) => !keys.includes(key)));
    const removed = Object.fromEntries(
      Object.entries(source).filter(([key]) => keys.includes(key)),
    );
    return { ok: true, value: next, spec, before: source, after: removed, sent: keys };
  }

  return { ok: false, error: `${where}: op "${op}" only works on lists and maps, use "set"` };
}

export interface SettingDiff {
  key: string;
  op: SettingOpKind;
  /** Markdown for the administrator. */
  line: string;
}

export interface SettingsPlan {
  /** The changes with their values in stored form, ready to be replayed. */
  ops: SettingOp[];
  diffs: SettingDiff[];
  writes: { entry: Entry; value: unknown }[];
  sections: Section[];
}

export type PlannedSettings = { ok: true; plan: SettingsPlan } | { ok: false; errors: string[] };

function diffLine(key: string, op: SettingOpKind, result: Extract<Updated, { ok: true }>): string {
  if (op === "add") return `\`${key}\` ➕ ${pretty(result.spec, result.after)}`;
  if (op === "remove") {
    const gone =
      result.after === null
        ? pretty(result.spec, result.before)
        : pretty(result.spec, result.after);
    return `\`${key}\` ➖ ${gone}`;
  }
  return `\`${key}\`: ${pretty(result.spec, result.before)} → ${pretty(result.spec, result.after)}`;
}

/**
 * Work out what a list of changes does to the stored settings: every value is checked, the rules
 * that span settings are checked on the result, and nothing is written. All changes pass or none.
 */
export async function planSettings(ctx: ToolContext, ops: SettingOp[]): Promise<PlannedSettings> {
  const snapshot = new Snapshot(ctx.guild);
  const working = new Map<string, { entry: Entry; value: unknown }>();
  const sections = new Set<Section>();
  const errors: string[] = [];
  const replay: SettingOp[] = [];
  const diffs: SettingDiff[] = [];

  for (const op of ops) {
    const found = locate(String(op.key ?? "").trim());
    if (!found) {
      errors.push(`"${op.key}" is not a setting; call settings_get to see the keys of a section`);
      continue;
    }
    const kind: SettingOpKind = op.op === "add" || op.op === "remove" ? op.op : "set";
    const { entry, section, path } = found;
    const state = working.get(entry.key) ?? { entry, value: await snapshot.entry(entry) };

    let result: Updated = update(entry.spec, state.value, path, kind, op.value, ctx, op.key);
    if (result.ok && entry.finish) {
      const finished = entry.finish(structuredClone(result.value), ctx);
      if (!finished.ok) {
        result = { ok: false, error: `${op.key}: ${finished.error}` };
      } else {
        // A whole-value adjustment (a currency emoji found by name) is what gets shown and stored.
        const whole = path.length === 0 && kind === "set";
        result = {
          ...result,
          value: finished.value,
          after: whole ? finished.value : result.after,
          sent: whole ? finished.value : result.sent,
        };
      }
    }
    if (!result.ok) {
      errors.push(result.error);
      continue;
    }

    state.value = result.value;
    working.set(entry.key, state);
    sections.add(section);
    replay.push({ key: op.key, op: kind, value: result.sent });

    // A later change of the same key replaces the line of the earlier one.
    const line = { key: op.key, op: kind, line: diffLine(op.key, kind, result) };
    const earlier =
      kind === "set" ? diffs.findIndex((diff) => diff.key === op.key && diff.op === "set") : -1;
    if (earlier >= 0) diffs[earlier] = line;
    else diffs.push(line);
  }

  if (errors.length > 0) return { ok: false, errors };

  const view: View = {
    get: async (key) => {
      const found = locate(key);
      if (!found) return snapshot.read(key);
      let node: any = working.get(found.entry.key)?.value ?? (await snapshot.entry(found.entry));
      for (const part of found.path) node = node?.[part];
      return node;
    },
  };

  for (const section of sections) {
    const problem = await section.check?.(view, ctx);
    if (problem) errors.push(problem);
  }
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    plan: { ops: replay, diffs, writes: [...working.values()], sections: [...sections] },
  };
}

/** Write confirmed changes. They are planned again first: the server may have changed meanwhile. */
export async function applySettings(
  ctx: ToolContext,
  ops: SettingOp[],
): Promise<{ ok: true; lines: string[]; notes: string[] } | { ok: false; errors: string[] }> {
  const planned = await planSettings(ctx, ops);
  if (!planned.ok) return planned;

  const touched = new Set<string>();
  for (const { entry, value } of planned.plan.writes) {
    await ctx.guild.set(entry.key, value);
    for (const [path, extra] of Object.entries(entry.also?.(value) ?? {})) {
      await ctx.guild.set(path, extra);
    }
    touched.add(entry.key);
  }

  // Once, however many of the changed sections ask for it.
  const notes = planned.plan.sections.some((section) => section.syncsAutoMod?.(touched))
    ? await syncAutoMod(ctx)
    : [];
  return { ok: true, lines: planned.plan.diffs.map((diff) => diff.line), notes };
}

function leaves(
  key: string,
  spec: Spec,
  value: unknown,
  ctx: ToolContext,
  note?: string,
): string[] {
  if (spec.t === "obj") {
    const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const lines = Object.entries(spec.fields).flatMap(([field, fieldSpec]) =>
      leaves(`${key}.${field}`, fieldSpec, source[field], ctx),
    );
    if (note && lines.length > 0) lines[0] += ` — ${note}`;
    return lines;
  }
  return [
    `${key}: ${describe(spec)} = ${show(spec, value, ctx.discordGuild)}${note ? ` — ${note}` : ""}`,
  ];
}

/** What the model gets when it asks for a section: every key, what it accepts, what it is now. */
export async function describeSection(ctx: ToolContext, id: string): Promise<string | null> {
  const section = SECTIONS.find((candidate) => candidate.id === id);
  if (!section) return null;

  const snapshot = new Snapshot(ctx.guild);
  const lines = [`${section.id}: ${section.title}`, "key: allowed = current"];
  for (const entry of section.entries) {
    lines.push(...leaves(entry.key, entry.spec, await snapshot.entry(entry), ctx, entry.note));
  }
  if (section.note) lines.push(section.note);
  return lines.join("\n");
}
