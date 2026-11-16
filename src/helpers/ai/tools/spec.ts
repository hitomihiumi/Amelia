import { ChannelType, type Guild as DiscordGuild } from "discord.js";
import { parseJson } from "../json";

/**
 * What a value the AI may set looks like. One description gives three things: the check of what
 * the model sent, the text that tells the model what is allowed, and the way the value is shown
 * to the administrator who has to confirm it.
 */
export type ChannelKind = "text" | "voice" | "category" | "any";

export type Spec =
  | { t: "bool" }
  | { t: "int"; min: number; max: number; nullable?: boolean }
  /** `blank` keeps an empty text as "" for fields that are never null in the database. */
  | {
      t: "str";
      max: number;
      min?: number;
      nullable?: boolean;
      blank?: boolean;
      pattern?: RegExp;
      hint?: string;
    }
  | { t: "enum"; values: readonly (string | number)[] }
  | { t: "channel"; kind: ChannelKind; nullable?: boolean }
  | { t: "role"; nullable?: boolean }
  /** `idKey` names the field that identifies an object item, so "add" replaces and "remove" finds it. */
  | { t: "list"; of: Spec; max: number; idKey?: string }
  /** `open` keeps the fields of the stored object that are not described here. */
  | { t: "obj"; fields: Record<string, Spec>; open?: boolean }
  /** `fresh` is what a key that did not exist yet starts from. */
  | { t: "map"; key: Spec; value: Spec; max: number; fresh?: () => unknown };

export const bool: Spec = { t: "bool" };
export const int = (min: number, max: number, nullable = false): Spec => ({
  t: "int",
  min,
  max,
  nullable,
});
/** Text that is stored as "" when empty, never as null. */
export const line = (max: number): Spec => ({ t: "str", max, blank: true });
export const text = (max: number, nullable = true, min = 0): Spec => ({
  t: "str",
  max,
  min,
  nullable,
});
export const oneOf = (...values: (string | number)[]): Spec => ({ t: "enum", values });
export const channel = (kind: ChannelKind = "text", nullable = true): Spec => ({
  t: "channel",
  kind,
  nullable,
});
export const role = (nullable = true): Spec => ({ t: "role", nullable });
export const list = (of: Spec, max: number, idKey?: string): Spec => ({
  t: "list",
  of,
  max,
  idKey,
});
export const obj = (fields: Record<string, Spec>, open = false): Spec => ({
  t: "obj",
  fields,
  open,
});
export const map = (key: Spec, value: Spec, max: number, fresh?: () => unknown): Spec => ({
  t: "map",
  key,
  value,
  max,
  fresh,
});

const HTTP_URL = /^https?:\/\/\S+$/i;
export const url = (max = 2048): Spec => ({
  t: "str",
  max,
  nullable: true,
  pattern: HTTP_URL,
  hint: "http(s) link",
});
export const hexColor: Spec = {
  t: "str",
  max: 7,
  nullable: true,
  pattern: /^#?[0-9a-f]{6}$/i,
  hint: "hex colour like #5865F2",
};

export type Coerced = { ok: true; value: any } | { ok: false; error: string };

const fail = (error: string): Coerced => ({ ok: false, error });
const done = (value: unknown): Coerced => ({ ok: true, value });

const SNOWFLAKE = /^\d{17,20}$/;
const TRUE_WORDS = new Set(["true", "1", "on", "yes", "enable", "enabled", "да", "вкл", "так"]);
const FALSE_WORDS = new Set([
  "false",
  "0",
  "off",
  "no",
  "disable",
  "disabled",
  "нет",
  "выкл",
  "ні",
]);
const NULL_WORDS = new Set(["", "null", "none", "nil", "-", "нет", "немає"]);

/**
 * Models send values as JSON text, as bare words, or as real JSON. A string that holds a JSON
 * list, object, quoted text or one of true/false/null is taken as JSON; anything else stays the
 * string it is. Digits stay text on purpose: an id read as a number would be rounded.
 */
export function parseLoose(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^[\[{"]/.test(trimmed) || /^(true|false|null)$/.test(trimmed)) {
    try {
      return parseJson(trimmed);
    } catch {
      return raw;
    }
  }
  return raw;
}

function isNullish(raw: unknown): boolean {
  return (
    raw === null ||
    raw === undefined ||
    (typeof raw === "string" && NULL_WORDS.has(raw.trim().toLowerCase()))
  );
}

function channelKindOf(type: ChannelType): ChannelKind | null {
  switch (type) {
    case ChannelType.GuildText:
    case ChannelType.GuildAnnouncement:
    case ChannelType.GuildForum:
    case ChannelType.GuildMedia:
    case ChannelType.PublicThread:
    case ChannelType.PrivateThread:
    case ChannelType.AnnouncementThread:
      return "text";
    case ChannelType.GuildVoice:
    case ChannelType.GuildStageVoice:
      return "voice";
    case ChannelType.GuildCategory:
      return "category";
    default:
      return null;
  }
}

/** Find one thing by id, mention or name. More than one match is an error that lists them. */
function resolveNamed<T extends { id: string; name: string }>(
  raw: unknown,
  items: T[],
  mention: RegExp,
  what: string,
): { ok: true; item: T } | { ok: false; error: string } {
  // A number this big has already lost its last digits: it is some other id by now.
  if (typeof raw === "number" && !Number.isSafeInteger(raw)) {
    return { ok: false, error: `send the id of the ${what} as text in quotes` };
  }
  const input = String(raw ?? "").trim();
  const mentioned = mention.exec(input)?.[1];
  const id = mentioned ?? (SNOWFLAKE.test(input) ? input : null);

  if (id) {
    const found = items.find((item) => item.id === id);
    return found ? { ok: true, item: found } : { ok: false, error: `no ${what} with id ${id}` };
  }

  const name = input.replace(/^[#@]/, "").toLowerCase();
  if (!name) return { ok: false, error: `${what} is missing` };

  const exact = items.filter((item) => item.name.toLowerCase() === name);
  const matches =
    exact.length > 0 ? exact : items.filter((item) => item.name.toLowerCase().includes(name));

  if (matches.length === 1) return { ok: true, item: matches[0] };
  if (matches.length === 0) return { ok: false, error: `no ${what} named "${input}"` };
  return {
    ok: false,
    error: `"${input}" matches several ${what}s: ${matches
      .slice(0, 6)
      .map((item) => `${item.name} (${item.id})`)
      .join(", ")}. Use the id.`,
  };
}

export function resolveChannel(guild: DiscordGuild, raw: unknown, kind: ChannelKind) {
  const items = [...guild.channels.cache.values()]
    .filter((item) => {
      const itemKind = channelKindOf(item.type);
      return itemKind !== null && (kind === "any" || itemKind === kind);
    })
    .map((item) => ({ id: item.id, name: item.name }));
  return resolveNamed(
    raw,
    items,
    /^<#(\d{17,20})>$/,
    kind === "any" ? "channel" : `${kind} channel`,
  );
}

export function resolveRole(guild: DiscordGuild, raw: unknown) {
  const items = [...guild.roles.cache.values()]
    .filter((item) => item.id !== guild.id)
    .map((item) => ({ id: item.id, name: item.name }));
  return resolveNamed(raw, items, /^<@&(\d{17,20})>$/, "role");
}

/**
 * Check a value against its description and bring it into the stored form: names and mentions
 * become ids, words become booleans and numbers. `current` fills the fields an object left out.
 */
export function coerce(
  spec: Spec,
  input: unknown,
  guild: DiscordGuild,
  where = "value",
  current?: unknown,
): Coerced {
  const raw = spec.t === "str" ? input : parseLoose(input);

  switch (spec.t) {
    case "bool": {
      if (typeof raw === "boolean") return done(raw);
      const word = String(raw).trim().toLowerCase();
      if (TRUE_WORDS.has(word)) return done(true);
      if (FALSE_WORDS.has(word)) return done(false);
      return fail(`${where}: expected true or false`);
    }

    case "int": {
      if (spec.nullable && isNullish(raw)) return done(null);
      const value = typeof raw === "number" ? raw : Number(String(raw).trim());
      if (!Number.isInteger(value)) return fail(`${where}: expected a whole number`);
      if (value < spec.min || value > spec.max) {
        return fail(`${where}: must be between ${spec.min} and ${spec.max}`);
      }
      return done(value);
    }

    case "str": {
      const empty = (): Coerced =>
        spec.blank ? done("") : spec.nullable ? done(null) : fail(`${where}: cannot be empty`);
      if (isNullish(raw) && raw !== "") return empty();
      if (typeof raw !== "string" && typeof raw !== "number")
        return fail(`${where}: expected text`);
      let value = String(raw).trim();
      // A model sometimes wraps a text value in JSON quotes a second time.
      if (/^"[\s\S]*"$/.test(value)) {
        try {
          const inner = JSON.parse(value);
          if (typeof inner === "string") value = inner.trim();
        } catch {
          // Quotes that are part of the text stay.
        }
      }
      if (!value) return empty();
      if (value.length > spec.max) return fail(`${where}: at most ${spec.max} characters`);
      if (value.length < (spec.min ?? 0)) return fail(`${where}: at least ${spec.min} characters`);
      if (spec.pattern && !spec.pattern.test(value)) {
        return fail(`${where}: expected ${spec.hint ?? "another format"}`);
      }
      return done(value);
    }

    case "enum": {
      const found = spec.values.find(
        (value) => String(value).toLowerCase() === String(raw).trim().toLowerCase(),
      );
      return found === undefined
        ? fail(`${where}: must be one of ${spec.values.join(", ")}`)
        : done(found);
    }

    case "channel": {
      if (isNullish(raw))
        return spec.nullable ? done(null) : fail(`${where}: a channel is required`);
      const found = resolveChannel(guild, raw, spec.kind);
      return found.ok ? done(found.item.id) : fail(`${where}: ${found.error}`);
    }

    case "role": {
      if (isNullish(raw)) return spec.nullable ? done(null) : fail(`${where}: a role is required`);
      const found = resolveRole(guild, raw);
      return found.ok ? done(found.item.id) : fail(`${where}: ${found.error}`);
    }

    case "list": {
      const items = Array.isArray(raw) ? raw : isNullish(raw) ? [] : [raw];
      if (items.length > spec.max) return fail(`${where}: at most ${spec.max} items`);
      const out: unknown[] = [];
      for (const [index, item] of items.entries()) {
        const result = coerce(spec.of, item, guild, `${where}[${index}]`);
        if (!result.ok) return result;
        if (!out.some((existing) => sameItem(spec, existing, result.value))) out.push(result.value);
      }
      return done(out);
    }

    case "obj": {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return fail(`${where}: expected an object with ${Object.keys(spec.fields).join(", ")}`);
      }
      const source = raw as Record<string, unknown>;
      const unknown = Object.keys(source).filter((key) => !(key in spec.fields));
      if (unknown.length > 0) {
        return fail(
          `${where}: unknown field ${unknown.join(", ")}; allowed: ${Object.keys(spec.fields).join(", ")}`,
        );
      }
      const base = (current && typeof current === "object" ? current : {}) as Record<
        string,
        unknown
      >;
      const out: Record<string, unknown> = spec.open ? { ...base } : {};
      for (const [key, fieldSpec] of Object.entries(spec.fields)) {
        if (key in source) {
          const result = coerce(fieldSpec, source[key], guild, `${where}.${key}`, base[key]);
          if (!result.ok) return result;
          out[key] = result.value;
        } else if (key in base) {
          out[key] = base[key];
        } else if (isRequired(fieldSpec)) {
          return fail(`${where}: "${key}" is required (${describe(fieldSpec)})`);
        } else if (fieldSpec.t === "obj") {
          // A nested object that was left out may still have required fields of its own.
          const result = coerce(fieldSpec, {}, guild, `${where}.${key}`);
          if (!result.ok) return result;
          out[key] = result.value;
        } else {
          out[key] = blank(fieldSpec);
        }
      }
      return done(out);
    }

    case "map": {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return fail(`${where}: expected an object of key → value`);
      }
      const entries = Object.entries(raw as Record<string, unknown>);
      if (entries.length > spec.max) return fail(`${where}: at most ${spec.max} entries`);
      const base = (current && typeof current === "object" ? current : {}) as Record<
        string,
        unknown
      >;
      const out: Record<string, unknown> = {};
      for (const [key, value] of entries) {
        const keyResult = coerce(spec.key, key, guild, `${where} key "${key}"`);
        if (!keyResult.ok) return keyResult;
        const valueResult = coerce(
          spec.value,
          value,
          guild,
          `${where}.${key}`,
          base[String(keyResult.value)] ?? spec.fresh?.(),
        );
        if (!valueResult.ok) return valueResult;
        out[String(keyResult.value)] = valueResult.value;
      }
      return done(out);
    }
  }
}

/** A field a new object cannot do without: there is no empty value that would be a fair guess. */
function isRequired(spec: Spec): boolean {
  switch (spec.t) {
    case "int":
      // Zero is a fair "none" where it is allowed (no discount, no delay), not where it is not (a price).
      return !spec.nullable && (spec.min > 0 || spec.max < 0);
    case "channel":
    case "role":
      return !spec.nullable;
    case "str":
      return !spec.nullable && !spec.blank;
    case "enum":
      return true;
    default:
      return false;
  }
}

/** Two list items are the same thing: equal values, or objects with the same identifying field. */
export function sameItem(spec: Extract<Spec, { t: "list" }>, a: unknown, b: unknown): boolean {
  if (spec.idKey && a && b && typeof a === "object" && typeof b === "object") {
    return (a as any)[spec.idKey] === (b as any)[spec.idKey];
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

/** The emptiest value a description allows, for fields the database never had. */
export function blank(spec: Spec): unknown {
  switch (spec.t) {
    case "bool":
      return false;
    case "int":
      return spec.nullable ? null : Math.max(spec.min, Math.min(0, spec.max));
    case "str":
      return spec.nullable && !spec.blank ? null : "";
    case "enum":
      return spec.values[0];
    case "channel":
    case "role":
      return null;
    case "list":
      return [];
    case "map":
      return {};
    case "obj":
      return Object.fromEntries(
        Object.entries(spec.fields).map(([key, field]) => [key, blank(field)]),
      );
  }
}

/** A stored value with the gaps filled in, so old rows read like complete ones. */
export function fill(spec: Spec, value: unknown, fallback?: unknown): unknown {
  if (spec.t === "obj") {
    const source = (
      value && typeof value === "object" && !Array.isArray(value) ? value : {}
    ) as Record<string, unknown>;
    const defaults = (fallback && typeof fallback === "object" ? fallback : {}) as Record<
      string,
      unknown
    >;
    return {
      ...(spec.open ? source : {}),
      ...Object.fromEntries(
        Object.entries(spec.fields).map(([key, field]) => [
          key,
          fill(field, source[key], defaults[key]),
        ]),
      ),
    };
  }
  if (spec.t === "list")
    return Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : [];
  if (spec.t === "map") {
    return value && typeof value === "object" && !Array.isArray(value) ? value : (fallback ?? {});
  }
  if (value === undefined || (value === null && !("nullable" in spec && spec.nullable))) {
    return fallback !== undefined ? fallback : blank(spec);
  }
  return value;
}

/** What the model is told a value may be. */
export function describe(spec: Spec): string {
  switch (spec.t) {
    case "bool":
      return "bool";
    case "int":
      return `int ${spec.min}..${spec.max}${spec.nullable ? "|null" : ""}`;
    case "str":
      return `${spec.hint ?? "text"} ≤${spec.max}${spec.nullable ? "|null" : ""}`;
    case "enum":
      return spec.values.join("|");
    case "channel":
      return `${spec.kind === "any" ? "" : `${spec.kind} `}channel${spec.nullable ? "|null" : ""}`;
    case "role":
      return `role${spec.nullable ? "|null" : ""}`;
    case "list":
      return `list ≤${spec.max} of ${describe(spec.of)}`;
    case "obj":
      return `{${Object.entries(spec.fields)
        .map(([key, field]) => `${key}: ${describe(field)}`)
        .join(", ")}}`;
    case "map":
      return `map ≤${spec.max} {${describe(spec.key)}: ${describe(spec.value)}}`;
  }
}

function clipText(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** A value as the model reads it: ids come with names, long things are cut. */
export function show(spec: Spec, value: unknown, guild: DiscordGuild): string {
  if (value === null || value === undefined) return "null";
  switch (spec.t) {
    case "channel": {
      const found = guild.channels.cache.get(String(value));
      return found ? `#${found.name} (${found.id})` : `${value} (deleted)`;
    }
    case "role": {
      const found = guild.roles.cache.get(String(value));
      return found ? `@${found.name} (${found.id})` : `${value} (deleted)`;
    }
    case "list": {
      const items = Array.isArray(value) ? value : [];
      const shown = items.slice(0, 10).map((item) => show(spec.of, item, guild));
      return `[${shown.join(", ")}${items.length > 10 ? `, … ${items.length - 10} more` : ""}]`;
    }
    case "obj": {
      const source = (typeof value === "object" ? value : {}) as Record<string, unknown>;
      return `{${Object.entries(spec.fields)
        .map(([key, field]) => `${key}: ${show(field, source[key], guild)}`)
        .join(", ")}}`;
    }
    case "map": {
      const entries = Object.entries(
        (typeof value === "object" ? value : {}) as Record<string, unknown>,
      );
      const shown = entries
        .slice(0, 12)
        .map(([key, item]) => `${key}: ${show(spec.value, item, guild)}`);
      return `{${shown.join(", ")}${entries.length > 12 ? `, … ${entries.length - 12} more` : ""}}`;
    }
    case "str":
      return JSON.stringify(clipText(String(value), 120));
    default:
      return String(value);
  }
}

/** A value as the administrator reads it in the confirmation: mentions, ticks, short text. */
export function pretty(spec: Spec, value: unknown, max = 160): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (spec.t) {
    case "bool":
      return value ? "✅" : "❌";
    case "channel":
      return `<#${value}>`;
    case "role":
      return `<@&${value}>`;
    case "list": {
      const items = Array.isArray(value) ? value : [];
      if (items.length === 0) return "—";
      const shown = items.slice(0, 8).map((item) => pretty(spec.of, item, 60));
      return clipText(
        `${shown.join(", ")}${items.length > 8 ? ` … +${items.length - 8}` : ""}`,
        max * 2,
      );
    }
    case "obj": {
      const source = (typeof value === "object" ? value : {}) as Record<string, unknown>;
      return clipText(
        Object.entries(spec.fields)
          .filter(
            ([key]) => source[key] !== null && source[key] !== undefined && source[key] !== "",
          )
          .map(([key, field]) => `${key}: ${pretty(field, source[key], 60)}`)
          .join(", ") || "—",
        max * 2,
      );
    }
    case "map": {
      const entries = Object.entries(
        (typeof value === "object" ? value : {}) as Record<string, unknown>,
      );
      if (entries.length === 0) return "—";
      const shown = entries
        .slice(0, 8)
        .map(([key, item]) => `${key} → ${pretty(spec.value, item, 60)}`);
      return clipText(
        `${shown.join(", ")}${entries.length > 8 ? ` … +${entries.length - 8}` : ""}`,
        max * 2,
      );
    }
    case "str":
      return `\`${clipText(String(value).replace(/`/g, "'").replace(/\s+/g, " "), max)}\``;
    default:
      return `\`${value}\``;
  }
}
