/**
 * Shared moderation types.
 *
 * These types are mirrored in the dashboard repository
 * (`src/lib/db/types/Moderation.ts`) — keep both copies in sync.
 */

/** Punishment applied by auto moderation or by warn escalation. */
export enum PunishmentType {
  Kick = "kick",
  Ban = "ban",
  Warn = "warn",
  Mute = "mute",
}

/** Every moderation action is stored as a numbered case of one of these types. */
export type ModerationCaseType =
  | "warn"
  | "mute"
  | "kick"
  | "ban"
  | "note"
  | "unwarn"
  | "unmute"
  | "unban"
  | "purge";

/** Where the case came from. */
export type ModerationCaseSource = "command" | "automod" | "dashboard" | "submission";

/** Punishment description stored in auto moderation settings. */
export interface Punishment {
  type: PunishmentType;
  /** Duration in seconds. `0` means permanent. */
  time: number;
  reason: string;
}

/** Escalation rule: once a member reaches `count` active warns, apply `punishment`. */
export interface WarnThreshold {
  count: number;
  punishment: Punishment;
}

/** Field types available in the dashboard form builder. */
export type ModerationFormFieldType =
  | "short"
  | "paragraph"
  | "number"
  | "boolean"
  | "select"
  | "user"
  | "channel"
  | "message_link"
  | "url";

export interface ModerationFormFieldOption {
  id: string;
  label: string;
  value: string;
}

/** A single customizable field of a report/appeal form. */
export interface ModerationFormField {
  id: string;
  label: string;
  description: string | null;
  type: ModerationFormFieldType;
  required: boolean;
  placeholder: string | null;
  /** Minimum length (text) or minimum value (number). */
  min: number | null;
  /** Maximum length (text) or maximum value (number). */
  max: number | null;
  /** Only used by `select` fields. */
  options: ModerationFormFieldOption[];
}

/** Configuration of one form (report or appeal). */
export interface ModerationForm {
  enabled: boolean;
  /** Channel the submissions are posted to. */
  channel: string | null;
  /** Seconds a member has to wait between two submissions. */
  cooldown: number;
  /** How many pending submissions one member may have at a time. */
  max_pending: number;
  /** Hide the author from the moderation embed (the id is still stored). */
  allow_anonymous: boolean;
  /** Require picking the reported member (reports only). */
  require_target: boolean;
  /** Allow banned users to submit (appeals only). */
  allow_banned: boolean;
  fields: ModerationFormField[];
  /** Custom texts; `null` falls back to the bot translations. */
  success_message: string | null;
  approve_message: string | null;
  reject_message: string | null;
}

export type ModerationSubmissionKind = "report" | "appeal";

export type ModerationSubmissionStatus = "pending" | "in_review" | "approved" | "rejected";

/** One answer stored in `ModerationSubmission.answers`. */
export interface ModerationSubmissionAnswer {
  fieldId: string;
  label: string;
  type: ModerationFormFieldType;
  value: string | number | boolean | null;
}

export const DEFAULT_REPORT_FORM: ModerationForm = {
  enabled: false,
  channel: null,
  cooldown: 600,
  max_pending: 3,
  allow_anonymous: false,
  require_target: true,
  allow_banned: false,
  fields: [],
  success_message: null,
  approve_message: null,
  reject_message: null,
};

export const DEFAULT_APPEAL_FORM: ModerationForm = {
  enabled: false,
  channel: null,
  cooldown: 86400,
  max_pending: 1,
  allow_anonymous: false,
  require_target: false,
  allow_banned: true,
  fields: [],
  success_message: null,
  approve_message: null,
  reject_message: null,
};
