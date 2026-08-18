/**
 * Audit log types.
 *
 * These types are mirrored in the dashboard repository
 * (`src/lib/db/types/Audit.ts`) — keep both copies in sync.
 */

/** Everything the audit log can report. */
export type AuditEventKey =
  // Members
  | "member_join"
  | "member_leave"
  | "member_roles"
  | "member_nickname"
  | "member_ban"
  | "member_unban"
  | "member_kick"
  | "member_timeout"
  // Messages
  | "message_delete"
  | "message_edit"
  | "message_bulk_delete"
  // Voice
  | "voice_join"
  | "voice_leave"
  | "voice_move"
  // Server
  | "channel_create"
  | "channel_delete"
  | "channel_update"
  | "role_create"
  | "role_delete"
  | "role_update"
  | "guild_update";

export type AuditCategory = "members" | "messages" | "voice" | "server";

/** Per-event switch with an optional channel override. */
export interface AuditEventConfig {
  enabled: boolean;
  /** `null` falls back to `audit.channel`. */
  channel: string | null;
}

export interface AuditSettings {
  enabled: boolean;
  channel: string | null;
  ignore_channels: string[];
  ignore_roles: string[];
  ignore_bots: boolean;
  webhook: {
    name: string | null;
    avatar: string | null;
  };
  events: Partial<Record<AuditEventKey, AuditEventConfig>>;
}

/** Which category an event belongs to, used for grouping in the dashboard. */
export const AUDIT_EVENT_CATEGORY: Record<AuditEventKey, AuditCategory> = {
  member_join: "members",
  member_leave: "members",
  member_roles: "members",
  member_nickname: "members",
  member_ban: "members",
  member_unban: "members",
  member_kick: "members",
  member_timeout: "members",
  message_delete: "messages",
  message_edit: "messages",
  message_bulk_delete: "messages",
  voice_join: "voice",
  voice_leave: "voice",
  voice_move: "voice",
  channel_create: "server",
  channel_delete: "server",
  channel_update: "server",
  role_create: "server",
  role_delete: "server",
  role_update: "server",
  guild_update: "server",
};

export const AUDIT_EVENT_KEYS = Object.keys(AUDIT_EVENT_CATEGORY) as AuditEventKey[];

export const AUDIT_CATEGORIES: AuditCategory[] = ["members", "messages", "voice", "server"];

/** Colour of the embed stripe, per event. */
export const AUDIT_EVENT_COLOR: Record<AuditEventKey, number> = {
  member_join: 0x57f287,
  member_leave: 0xfee75c,
  member_roles: 0x5bc0be,
  member_nickname: 0x5bc0be,
  member_ban: 0xed4245,
  member_unban: 0x57f287,
  member_kick: 0xe67e22,
  member_timeout: 0xe67e22,
  message_delete: 0xed4245,
  message_edit: 0x5865f2,
  message_bulk_delete: 0xed4245,
  voice_join: 0x9b59b6,
  voice_leave: 0x9b59b6,
  voice_move: 0x9b59b6,
  channel_create: 0x57f287,
  channel_delete: 0xed4245,
  channel_update: 0x5865f2,
  role_create: 0x57f287,
  role_delete: 0xed4245,
  role_update: 0x5865f2,
  guild_update: 0x5865f2,
};

export const DEFAULT_AUDIT_SETTINGS: AuditSettings = {
  enabled: false,
  channel: null,
  ignore_channels: [],
  ignore_roles: [],
  ignore_bots: true,
  webhook: { name: null, avatar: null },
  events: {},
};

/** An event without an explicit configuration is on once the log is enabled. */
export function resolveAuditEvent(
  events: AuditSettings["events"],
  event: AuditEventKey,
): AuditEventConfig {
  return events?.[event] ?? { enabled: true, channel: null };
}
