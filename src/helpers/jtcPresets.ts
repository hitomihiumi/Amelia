import { randomBytes } from "node:crypto";
import { OverwriteType, PermissionFlagsBits } from "discord.js";
import type { JTCPreset, JTCPresetOverwrite } from "../types/helpers/UserSchema";

/**
 * Pure logic behind Join To Create channel presets.
 * Nothing in here talks to Discord or the database, so it can be tested in isolation.
 * Presets live in the `User.jtcPresets` JSON column (one row per user and guild).
 */

/** Maximum number of presets a user may keep (per guild). */
export const JTC_PRESET_LIMIT = 5;
/** Maximum number of permission overwrites stored per preset (keeps the JSON column small). */
export const JTC_PRESET_MAX_OVERWRITES = 50;
export const JTC_PRESET_NAME_MAX = 40;
export const JTC_PRESET_DESCRIPTION_MAX = 80;
/** Discord's own limits for the channel settings we store. */
export const JTC_CHANNEL_NAME_MAX = 100;
export const JTC_MIN_BITRATE = 8000;
const JTC_DEFAULT_BITRATE = 64000;
const JTC_MAX_BITRATE = 384000;
/** Discord allows at most 100 overwrites per channel. */
const DISCORD_MAX_OVERWRITES = 100;

/** Permissions the channel owner always keeps (same as in the Join To Create handler). */
export const JTC_OWNER_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.MoveMembers,
  PermissionFlagsBits.MuteMembers,
  PermissionFlagsBits.DeafenMembers,
];

/**
 * Bits a stored overwrite may contain: the permissions that are meaningful in a voice channel.
 * Guild-wide bits (Administrator, ManageGuild, ...) are never kept, and neither are
 * ManageRoles / ManageWebhooks, so a preset cannot hand out the ability to change permissions.
 */
const VOICE_OVERWRITE_NAMES = [
  "CreateInstantInvite",
  "ManageChannels",
  "AddReactions",
  "ViewChannel",
  "SendMessages",
  "SendTTSMessages",
  "ManageMessages",
  "EmbedLinks",
  "AttachFiles",
  "ReadMessageHistory",
  "MentionEveryone",
  "UseExternalEmojis",
  "Connect",
  "Speak",
  "Stream",
  "MuteMembers",
  "DeafenMembers",
  "MoveMembers",
  "UseVAD",
  "PrioritySpeaker",
  "UseApplicationCommands",
  "ManageThreads",
  "CreatePublicThreads",
  "CreatePrivateThreads",
  "UseExternalStickers",
  "SendMessagesInThreads",
  "UseEmbeddedActivities",
  "UseSoundboard",
  "CreateEvents",
  "ManageEvents",
  "UseExternalSounds",
  "SendVoiceMessages",
  "SendPolls",
  "UseExternalApps",
  "PinMessages",
  "BypassSlowmode",
  "SetVoiceChannelStatus",
] as const;

export const JTC_OVERWRITE_MASK: bigint = VOICE_OVERWRITE_NAMES.reduce((mask, name) => {
  const bit = (PermissionFlagsBits as Record<string, bigint | undefined>)[name];
  return bit === undefined ? mask : mask | bit;
}, 0n);

const SNOWFLAKE = /^\d{15,25}$/;

/** Short random id (10 hex chars) that is not yet used by `existing`. */
export function generatePresetId(existing: Iterable<string> = []): string {
  const used = new Set(existing);
  for (let i = 0; i < 10; i++) {
    const id = randomBytes(5).toString("hex");
    if (!used.has(id)) return id;
  }
  return randomBytes(8).toString("hex");
}

/** Normalises a bitfield (string/number/bigint) to a masked decimal string, or null if invalid. */
export function sanitizeBits(value: unknown): string | null {
  try {
    let big: bigint;
    if (typeof value === "bigint") big = value;
    else if (typeof value === "number" && Number.isSafeInteger(value)) big = BigInt(value);
    else if (typeof value === "string" && /^\d{1,20}$/.test(value)) big = BigInt(value);
    else return null;
    if (big < 0n) return null;
    return (big & JTC_OVERWRITE_MASK).toString();
  } catch {
    return null;
  }
}

function sanitizeOverwrite(raw: unknown): JTCPresetOverwrite | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !SNOWFLAKE.test(o.id)) return null;
  if (o.type !== "role" && o.type !== "member") return null;
  const allow = sanitizeBits(o.allow);
  const deny = sanitizeBits(o.deny);
  if (allow === null || deny === null) return null;
  // A bit cannot be both allowed and denied; keep deny and drop the bit from allow.
  const clean = BigInt(allow) & ~BigInt(deny);
  return { id: o.id, type: o.type, allow: clean.toString(), deny };
}

function sanitizeText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, max).trim();
  return text.length > 0 ? text : null;
}

function sanitizeInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

/**
 * Validates whatever came out of the Json column. Anything malformed is dropped
 * (whole preset if essential fields are missing, single overwrites otherwise), ids are
 * de-duplicated and the list is capped at `JTC_PRESET_LIMIT`.
 */
export function sanitizePresets(raw: unknown): JTCPreset[] {
  if (!Array.isArray(raw)) return [];
  const result: JTCPreset[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (result.length >= JTC_PRESET_LIMIT) break;
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, unknown>;
    const id = typeof p.id === "string" && p.id.length > 0 && p.id.length <= 64 ? p.id : null;
    const name = sanitizeText(p.name, JTC_PRESET_NAME_MAX);
    const channel = p.channel as Record<string, unknown> | null | undefined;
    if (!id || !name || seen.has(id) || !channel || typeof channel !== "object") continue;
    const channelName = sanitizeText(channel.name, JTC_CHANNEL_NAME_MAX);
    if (!channelName) continue;

    const overwrites: JTCPresetOverwrite[] = [];
    const overwriteIds = new Set<string>();
    if (Array.isArray(channel.overwrites)) {
      for (const entry of channel.overwrites) {
        if (overwrites.length >= JTC_PRESET_MAX_OVERWRITES) break;
        const clean = sanitizeOverwrite(entry);
        if (!clean || overwriteIds.has(clean.id)) continue;
        overwriteIds.add(clean.id);
        overwrites.push(clean);
      }
    }

    seen.add(id);
    result.push({
      id,
      name,
      description: sanitizeText(p.description, JTC_PRESET_DESCRIPTION_MAX),
      channel: {
        name: channelName,
        userLimit: sanitizeInt(channel.userLimit, 0, 99, 0),
        bitrate: sanitizeInt(
          channel.bitrate,
          JTC_MIN_BITRATE,
          JTC_MAX_BITRATE,
          JTC_DEFAULT_BITRATE,
        ),
        rtcRegion:
          typeof channel.rtcRegion === "string" &&
          channel.rtcRegion.length > 0 &&
          channel.rtcRegion.length <= 50
            ? channel.rtcRegion
            : null,
        overwrites,
      },
    });
  }

  return result;
}

/** Structural subset of discord.js `PermissionOverwrites` that we need. */
export interface OverwriteLike {
  id: string;
  type: OverwriteType | number;
  allow: { bitfield: bigint };
  deny: { bitfield: bigint };
}

export interface SnapshotContext {
  guildId: string;
  ownerId: string;
  botId?: string | null;
  /** Roles managed by an integration / bot; they are never stored. */
  managedRoleIds?: Iterable<string>;
}

/**
 * Converts a channel's overwrites into JSON-safe preset entries.
 * Skipped: the owner's own overwrite, the bot's member overwrite, managed roles and empty
 * entries. @everyone comes first and the list is capped at `JTC_PRESET_MAX_OVERWRITES`.
 */
export function snapshotOverwrites(
  overwrites: Iterable<OverwriteLike>,
  ctx: SnapshotContext,
): JTCPresetOverwrite[] {
  const managed = new Set(ctx.managedRoleIds ?? []);
  const out: JTCPresetOverwrite[] = [];

  for (const ow of overwrites) {
    if (ow.id === ctx.ownerId) continue;
    if (ctx.botId && ow.id === ctx.botId) continue;
    const isRole = ow.type === OverwriteType.Role;
    if (isRole && managed.has(ow.id)) continue;
    const clean = sanitizeOverwrite({
      id: ow.id,
      type: isRole ? "role" : "member",
      allow: ow.allow.bitfield,
      deny: ow.deny.bitfield,
    });
    if (!clean || (clean.allow === "0" && clean.deny === "0")) continue;
    out.push(clean);
  }

  out.sort((a, b) => Number(b.id === ctx.guildId) - Number(a.id === ctx.guildId));
  return out.slice(0, JTC_PRESET_MAX_OVERWRITES);
}

export interface ChannelLike {
  name: string;
  userLimit: number;
  bitrate: number;
  rtcRegion: string | null;
  overwrites: Iterable<OverwriteLike>;
}

export interface PresetDraft {
  name: string;
  description: string | null;
  channel: JTCPreset["channel"];
}

/** Snapshots a voice channel's current settings. Returns null if the input name is empty. */
export function snapshotChannel(
  channel: ChannelLike,
  input: { name: string; description?: string | null },
  ctx: SnapshotContext,
): PresetDraft | null {
  const name = sanitizeText(input.name, JTC_PRESET_NAME_MAX);
  const channelName = sanitizeText(channel.name, JTC_CHANNEL_NAME_MAX);
  if (!name || !channelName) return null;
  return {
    name,
    description: sanitizeText(input.description, JTC_PRESET_DESCRIPTION_MAX),
    channel: {
      name: channelName,
      userLimit: sanitizeInt(channel.userLimit, 0, 99, 0),
      bitrate: sanitizeInt(channel.bitrate, JTC_MIN_BITRATE, JTC_MAX_BITRATE, JTC_DEFAULT_BITRATE),
      rtcRegion: channel.rtcRegion ? channel.rtcRegion : null,
      overwrites: snapshotOverwrites(channel.overwrites, ctx),
    },
  };
}

export function presetNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export type UpsertResult =
  | { ok: true; presets: JTCPreset[]; preset: JTCPreset; updated: boolean }
  | { ok: false; reason: "limit" };

/**
 * Adds a preset or, when a preset with the same name (case-insensitive) exists, overwrites it
 * in place (same id, same position, no extra slot used). Refuses new presets beyond the cap.
 */
export function upsertPreset(existing: JTCPreset[], draft: PresetDraft): UpsertResult {
  const presets = sanitizePresets(existing);
  const key = presetNameKey(draft.name);
  const index = presets.findIndex((p) => presetNameKey(p.name) === key);

  if (index >= 0) {
    const preset: JTCPreset = { ...draft, id: presets[index].id };
    const next = presets.slice();
    next[index] = preset;
    return { ok: true, presets: next, preset, updated: true };
  }

  if (presets.length >= JTC_PRESET_LIMIT) return { ok: false, reason: "limit" };

  const preset: JTCPreset = { ...draft, id: generatePresetId(presets.map((p) => p.id)) };
  return { ok: true, presets: [...presets, preset], preset, updated: false };
}

export function removePreset(
  existing: JTCPreset[],
  id: string,
): { presets: JTCPreset[]; removed: JTCPreset | null } {
  const presets = sanitizePresets(existing);
  const removed = presets.find((p) => p.id === id) ?? null;
  return { presets: presets.filter((p) => p.id !== id), removed };
}

export interface ApplyOverwrite {
  id: string;
  type: OverwriteType;
  allow: bigint;
  deny: bigint;
}

export interface ApplyContext {
  ownerId: string;
  botId?: string | null;
  /** Whether the role/member of a stored entry still exists in the guild. */
  exists: (entry: JTCPresetOverwrite) => boolean;
  /** Overwrites already on the channel that must survive (bot member, managed roles). */
  keepExisting?: Iterable<OverwriteLike>;
}

/**
 * Builds the complete overwrite list for `channel.permissionOverwrites.set`:
 * preset entries that still resolve + preserved existing ones + the owner's own overwrite.
 * The owner entry is always present and can never be replaced by a preset entry.
 * `skipped` counts preset entries dropped because their role/member no longer exists.
 */
export function buildApplyOverwrites(
  entries: JTCPresetOverwrite[],
  ctx: ApplyContext,
): { overwrites: ApplyOverwrite[]; skipped: number } {
  const keep: ApplyOverwrite[] = [];
  for (const ow of ctx.keepExisting ?? []) {
    if (ow.id === ctx.ownerId) continue;
    keep.push({
      id: ow.id,
      type: ow.type === OverwriteType.Role ? OverwriteType.Role : OverwriteType.Member,
      allow: ow.allow.bitfield,
      deny: ow.deny.bitfield,
    });
  }
  const reserved = new Set([ctx.ownerId, ...keep.map((k) => k.id)]);
  if (ctx.botId) reserved.add(ctx.botId);

  const overwrites: ApplyOverwrite[] = [];
  let skipped = 0;
  for (const raw of entries) {
    const entry = sanitizeOverwrite(raw);
    if (!entry || reserved.has(entry.id)) continue;
    if (!ctx.exists(entry)) {
      skipped++;
      continue;
    }
    overwrites.push({
      id: entry.id,
      type: entry.type === "role" ? OverwriteType.Role : OverwriteType.Member,
      allow: BigInt(entry.allow),
      deny: BigInt(entry.deny),
    });
  }

  const ownerAllow = JTC_OWNER_PERMISSIONS.reduce((a, b) => a | b, 0n);
  const all = [
    ...overwrites,
    ...keep,
    { id: ctx.ownerId, type: OverwriteType.Member, allow: ownerAllow, deny: 0n },
  ];

  // Never exceed Discord's limit; the owner entry (last) is always kept.
  const trimmed =
    all.length > DISCORD_MAX_OVERWRITES
      ? [...all.slice(0, DISCORD_MAX_OVERWRITES - 1), all[all.length - 1]]
      : all;
  return { overwrites: trimmed, skipped };
}

export function clampBitrate(bitrate: number, max: number): number {
  return Math.max(JTC_MIN_BITRATE, Math.min(bitrate, Math.max(max, JTC_MIN_BITRATE)));
}

export interface SummaryLabels {
  limit: (limit: number) => string;
  unlimited: string;
  bitrate: (kbps: number) => string;
}

/** Short one-line description for a select option, e.g. "Limit 5 • 64 kbps" (max 100 chars). */
export function presetSummary(preset: JTCPreset, labels: SummaryLabels): string {
  const parts = [
    preset.channel.userLimit > 0 ? labels.limit(preset.channel.userLimit) : labels.unlimited,
    labels.bitrate(Math.round(preset.channel.bitrate / 1000)),
  ];
  return parts.join(" • ").slice(0, 100);
}

/**
 * Finds the temporary channel record owned by `userId`. The stored map may be keyed by the
 * lobby or by the temporary channel id, so the match is done on the record's `channel` value.
 */
export function isTempChannelOwner(map: unknown, channelId: string, userId: string): boolean {
  if (!(map instanceof Map)) return false;
  for (const data of map.values()) {
    if (data && data.channel === channelId && data.owner === userId) return true;
  }
  return false;
}

const locks = new Map<string, Promise<unknown>>();

/**
 * Serialises read-modify-write sections per key (in-memory, single process), so two quick
 * saves/deletes by the same user cannot overwrite each other's changes.
 */
export async function withPresetLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  const tail = run.catch(() => undefined);
  locks.set(key, tail);
  try {
    return await run;
  } finally {
    if (locks.get(key) === tail) locks.delete(key);
  }
}
