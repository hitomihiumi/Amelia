import type { Client, Guild as DiscordGuild, GuildMember } from "discord.js";

/** The part of the guild helper the tools need: values by path. */
export interface GuildStore {
  get(path: string): Promise<any>;
  set(path: string, value: any): Promise<void>;
}

/** Who asked, and where. Tools only exist for a server administrator. */
export interface ToolContext {
  client: Client;
  discordGuild: DiscordGuild;
  guild: GuildStore;
  /** The administrator the AI is talking to. Every action is checked against this member. */
  member: GuildMember;
  channelId: string;
  lang: string;
}

export type SettingOpKind = "set" | "add" | "remove";

/** One change of a setting, with the value already checked and brought into its stored form. */
export interface SettingOp {
  key: string;
  op: SettingOpKind;
  value: unknown;
}

export type ComponentKind = "embed" | "button" | "select_menu" | "modal" | "scenario" | "layout";

export type ModerationAction =
  | "warn"
  | "mute"
  | "kick"
  | "ban"
  | "unmute"
  | "unban"
  | "unwarn"
  | "note"
  | "purge"
  | "slowmode";

export interface ModerationOp {
  type: "moderate";
  action: ModerationAction;
  /** Target user, for everything but `unwarn`, `slowmode` and a `purge` of everyone. */
  userId?: string;
  /** Seconds: length of a mute or a ban, or the slowmode delay. */
  duration?: number | null;
  reason?: string | null;
  /** Days of messages to delete with a ban. */
  deleteDays?: number;
  /** Case number for `unwarn`. */
  caseNumber?: number;
  /** Messages to look through for `purge`. */
  amount?: number;
  /** Channel of a `purge` or `slowmode`. */
  channelId?: string;
}

export interface SendOp {
  type: "send";
  channelId: string;
  content: string | null;
  embeds: string[];
  buttons: string[];
  selectMenus: string[];
  layout: string | null;
}

/**
 * Something the AI prepared and an administrator has to confirm. Everything in it was validated
 * when it was proposed and is validated again when it is applied, since minutes may pass between.
 */
export type PlanOp =
  | { type: "settings"; ops: SettingOp[] }
  | { type: "component_save"; kind: ComponentKind; item: Record<string, any>; created: boolean }
  | { type: "component_delete"; kind: ComponentKind; id: string; name: string }
  | SendOp
  | ModerationOp;

export interface PlanStep {
  op: PlanOp;
  /** Markdown lines that tell the administrator what the step does. */
  lines: string[];
}

/** What the administrator is shown before pressing the button, in the order it will run. */
export interface Plan {
  steps: PlanStep[];
}

/** How one step of a confirmed plan went. */
export interface StepResult {
  ok: boolean;
  /** One markdown line for the administrator. */
  line: string;
}

/** A tool as the model sees it. */
export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
}

/** The tools of one request: what the model may call, and what it has queued so far. */
export interface ToolSession {
  declarations: ToolDeclaration[];
  /** Run a call. The answer goes back to the model; it never throws. */
  execute(call: ToolCall): Promise<Record<string, unknown>>;
  /** What was queued for confirmation, or null when the model only read things. */
  plan(): Promise<Plan | null>;
}

/** Given to `chat()` by whoever knows the member is an administrator. */
export interface ToolRuntime {
  /** Text sent with the question only: ids behind the mentions of the message. */
  notes: string | null;
  /** A fresh session; `chat()` starts another one when it has to ask a second model. */
  start(): ToolSession;
}
