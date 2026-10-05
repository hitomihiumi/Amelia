/**
 * Auto moderation on top of Discord's native AutoMod.
 *
 * The settings of the dashboard (`moderation.auto_moderation`) are the source of truth. This module
 * turns them into AutoMod rules of the server and keeps both in sync. It has no dependencies on
 * discord.js or on `fetch`: the Discord API is reached through a small `AutoModTransport`, so the
 * bot (discord.js REST) and the dashboard (plain `fetch` with the bot token) share this exact code.
 *
 * This module is mirrored in the dashboard repository (`src/lib/moderation/autoModeration.ts`) —
 * keep both copies in sync. Only the two import lines differ.
 */

import type {
  AutoModKind,
  AutoModPreset,
  AutoModRuleBase,
  AutoModerationSettings,
} from "../../types/helpers/ModerationSchema";
import { AUTOMOD_KINDS } from "../../types/helpers/ModerationSchema";
import { normalizeLink, validateLinkPattern } from "./linkPatterns";

export { AUTOMOD_KINDS };

// ---- Discord API constants -----------------------------------------------------------------

const EVENT_MESSAGE_SEND = 1;

const TRIGGER = { keyword: 1, spam: 3, preset: 4, mentionSpam: 5 } as const;

const ACTION = { block: 1, alert: 2, timeout: 3 } as const;

const PRESET_ID: Record<AutoModPreset, number> = { profanity: 1, sexual_content: 2, slurs: 3 };

/** What Discord accepts. Everything below is enforced by the API, we only report it earlier. */
export const AUTOMOD_LIMITS = {
  keywords: 1000,
  keywordLength: 60,
  regex: 10,
  regexLength: 260,
  allow: 100,
  exemptChannels: 50,
  exemptRoles: 20,
  blockMessage: 150,
  mentionLimit: 50,
  timeoutSeconds: 2_419_200,
  /** Timeout used when a "mute" punishment has no duration. */
  defaultTimeoutSeconds: 3600,
} as const;

/** Names of the rules in the Discord UI. They are also how a rule is found again if its id is lost. */
export const AUTOMOD_RULE_NAMES: Record<AutoModKind, string> = {
  invite: "Amelia: Invite links",
  links: "Amelia: Links",
  keywords: "Amelia: Blocked words",
  profanity: "Amelia: Word lists",
  mention_spam: "Amelia: Mention spam",
  spam: "Amelia: Spam",
};

/** Matches the invite domains of the old bot-side check. Rust regex syntax: no look-around. */
export const INVITE_REGEX =
  "(?i)(?:discord(?:app)?\\.com/invite|discord\\.gg|discord\\.me|dsc\\.gg|invite\\.gg)/[a-z0-9_-]+";

// ---- Validation ----------------------------------------------------------------------------

export interface AutoModIssue {
  kind: AutoModKind;
  /** Stable code, translated by the dashboard. */
  code:
    | "ignore_channels_too_many"
    | "ignore_roles_truncated"
    | "block_message_too_long"
    | "keywords_empty"
    | "keywords_too_many"
    | "keyword_too_long"
    | "regex_too_many"
    | "regex_too_long"
    | "allow_too_many"
    | "presets_empty"
    | "mention_limit_range"
    | "link_pattern_invalid"
    | "link_whitelist_unsupported"
    | "link_whitelist_too_large";
  params?: Record<string, string | number>;
}

function clean(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  for (const item of list) {
    if (typeof item !== "string") continue;
    const value = item.trim();
    if (value) seen.add(value);
  }
  return [...seen];
}

/**
 * Turn a link whitelist pattern (`youtube.com`, `*.wikipedia.org`, `discord.com/channels/*`, see
 * `linkPatterns.ts`) into the wildcard words of Discord's allow list.
 *
 * Discord only knows `*` at the start and the end of a word, so `youtube.com` becomes four words
 * that pin the host boundary (`://` before it, `/` or the end after it) instead of a loose
 * `*youtube.com*` that would also let `notyoutube.com` and `youtube.com.evil.xyz` through.
 * Returns `null` for a pattern with a wildcard in the middle, which Discord cannot express.
 */
export function linkPatternToAllowWords(pattern: string): string[] | null {
  const cleaned = normalizeLink(pattern).replace(/\*{2,}/g, "*");
  if (!cleaned) return null;
  if (/\*/.test(cleaned.slice(1, -1))) return null;

  const words = new Set<string>();
  const open = cleaned.endsWith("*");

  if (cleaned.startsWith("*")) {
    words.add(cleaned);
    if (!open) words.add(`${cleaned}/*`);
  } else {
    words.add(`*://${cleaned}`);
    words.add(`*.${cleaned}`);
    if (!open) {
      words.add(`*://${cleaned}/*`);
      words.add(`*.${cleaned}/*`);
    }
  }

  return [...words].filter((word) => word.length <= AUTOMOD_LIMITS.keywordLength);
}

function linksAllowList(patterns: string[]): { words: string[]; issues: AutoModIssue[] } {
  const issues: AutoModIssue[] = [];
  const words = new Set<string>();

  for (const pattern of clean(patterns)) {
    const invalid = validateLinkPattern(pattern);
    const expanded = invalid ? null : linkPatternToAllowWords(pattern);

    if (invalid) {
      issues.push({ kind: "links", code: "link_pattern_invalid", params: { pattern } });
    } else if (!expanded || expanded.length === 0) {
      issues.push({ kind: "links", code: "link_whitelist_unsupported", params: { pattern } });
    } else {
      expanded.forEach((word) => words.add(word));
    }
  }

  if (words.size > AUTOMOD_LIMITS.allow) {
    issues.push({
      kind: "links",
      code: "link_whitelist_too_large",
      params: { words: words.size, max: AUTOMOD_LIMITS.allow },
    });
  }

  return { words: [...words], issues };
}

function baseIssues(kind: AutoModKind, rule: AutoModRuleBase): AutoModIssue[] {
  const issues: AutoModIssue[] = [];
  if (clean(rule.ignore_channels).length > AUTOMOD_LIMITS.exemptChannels) {
    issues.push({
      kind,
      code: "ignore_channels_too_many",
      params: { max: AUTOMOD_LIMITS.exemptChannels },
    });
  }
  if ((rule.block_message?.trim().length ?? 0) > AUTOMOD_LIMITS.blockMessage) {
    issues.push({
      kind,
      code: "block_message_too_long",
      params: { max: AUTOMOD_LIMITS.blockMessage },
    });
  }
  return issues;
}

/** Problems that make Discord reject a rule (or silently shorten it). Checks enabled rules only. */
export function validateAutoModeration(settings: AutoModerationSettings): AutoModIssue[] {
  const issues: AutoModIssue[] = [];

  for (const kind of AUTOMOD_KINDS) {
    const rule = settings[kind];
    if (!rule?.enabled) continue;
    issues.push(...baseIssues(kind, rule));

    if (kind === "links") {
      issues.push(...linksAllowList(settings.links.ignore_links).issues);
    }

    if (kind === "keywords") {
      const { keywords, regex, allow } = settings.keywords;
      const words = clean(keywords);
      const patterns = clean(regex);

      if (words.length === 0 && patterns.length === 0) {
        issues.push({ kind, code: "keywords_empty" });
      }
      if (words.length > AUTOMOD_LIMITS.keywords) {
        issues.push({ kind, code: "keywords_too_many", params: { max: AUTOMOD_LIMITS.keywords } });
      }
      for (const word of words) {
        if (word.length > AUTOMOD_LIMITS.keywordLength) {
          issues.push({ kind, code: "keyword_too_long", params: { word, max: AUTOMOD_LIMITS.keywordLength } });
        }
      }
      if (patterns.length > AUTOMOD_LIMITS.regex) {
        issues.push({ kind, code: "regex_too_many", params: { max: AUTOMOD_LIMITS.regex } });
      }
      for (const pattern of patterns) {
        if (pattern.length > AUTOMOD_LIMITS.regexLength) {
          issues.push({ kind, code: "regex_too_long", params: { pattern, max: AUTOMOD_LIMITS.regexLength } });
        }
      }
      if (clean(allow).length > AUTOMOD_LIMITS.allow) {
        issues.push({ kind, code: "allow_too_many", params: { max: AUTOMOD_LIMITS.allow } });
      }
    }

    if (kind === "profanity") {
      if (!Array.isArray(settings.profanity.presets) || settings.profanity.presets.length === 0) {
        issues.push({ kind, code: "presets_empty" });
      }
      if (clean(settings.profanity.allow).length > AUTOMOD_LIMITS.allow) {
        issues.push({ kind, code: "allow_too_many", params: { max: AUTOMOD_LIMITS.allow } });
      }
    }

    if (kind === "mention_spam") {
      const limit = Number(settings.mention_spam.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > AUTOMOD_LIMITS.mentionLimit) {
        issues.push({ kind, code: "mention_limit_range", params: { max: AUTOMOD_LIMITS.mentionLimit } });
      }
    }
  }

  return issues;
}

// ---- Building a rule -----------------------------------------------------------------------

export interface DiscordAutoModAction {
  type: number;
  metadata?: { channel_id?: string; duration_seconds?: number; custom_message?: string };
}

export interface DiscordAutoModRuleBody {
  name: string;
  event_type: number;
  trigger_type: number;
  trigger_metadata: Record<string, unknown>;
  actions: DiscordAutoModAction[];
  enabled: boolean;
  exempt_roles: string[];
  exempt_channels: string[];
}

/** The native action whose execution event the bot answers with a case (one event per action). */
export type AutoModDriver = "block" | "alert" | "timeout";

export interface BuiltRule {
  body: DiscordAutoModRuleBody;
  warnings: AutoModIssue[];
  /** Discord applies the timeout itself, so the bot must not apply it a second time. */
  nativeTimeout: boolean;
  driver: AutoModDriver;
}

/** Discord offers the timeout action for keyword rules only. */
function supportsNativeTimeout(kind: AutoModKind): boolean {
  return kind === "invite" || kind === "links" || kind === "keywords";
}

export function nativeTimeoutSeconds(kind: AutoModKind, rule: AutoModRuleBase): number | null {
  if (!supportsNativeTimeout(kind) || rule.punishment?.type !== "mute") return null;

  const seconds = Number(rule.punishment.time);
  if (!Number.isFinite(seconds) || seconds <= 0) return AUTOMOD_LIMITS.defaultTimeoutSeconds;
  return Math.min(Math.floor(seconds), AUTOMOD_LIMITS.timeoutSeconds);
}

/**
 * Which native action the bot reacts to: Discord sends one event per executed action, and the bot
 * answers exactly one of them so a single trigger yields a single case. A timeout, when there is
 * one, comes first: its event also proves that Discord applied the timeout, so the bot only has to
 * record it. A rule needs at least one action, so when neither deleting nor alerting nor a timeout
 * is configured the message is blocked anyway.
 */
export function autoModDriver(kind: AutoModKind, rule: AutoModRuleBase): AutoModDriver {
  if (nativeTimeoutSeconds(kind, rule) !== null) return "timeout";
  if (rule.delete_message || !rule.alert_channel) return "block";
  return "alert";
}

function actionsFor(kind: AutoModKind, rule: AutoModRuleBase): DiscordAutoModAction[] {
  const actions: DiscordAutoModAction[] = [];
  const timeout = nativeTimeoutSeconds(kind, rule);
  const block = rule.delete_message || (!rule.alert_channel && timeout === null);

  if (block) {
    const custom = rule.block_message?.trim().slice(0, AUTOMOD_LIMITS.blockMessage);
    actions.push(
      custom ? { type: ACTION.block, metadata: { custom_message: custom } } : { type: ACTION.block },
    );
  }
  if (rule.alert_channel) {
    actions.push({ type: ACTION.alert, metadata: { channel_id: rule.alert_channel } });
  }
  if (timeout !== null) {
    actions.push({ type: ACTION.timeout, metadata: { duration_seconds: timeout } });
  }

  return actions;
}

function metadataFor(
  kind: AutoModKind,
  settings: AutoModerationSettings,
  warnings: AutoModIssue[],
): { trigger: number; metadata: Record<string, unknown> } {
  switch (kind) {
    case "invite":
      return { trigger: TRIGGER.keyword, metadata: { regex_patterns: [INVITE_REGEX] } };

    case "links": {
      const { words, issues } = linksAllowList(settings.links.ignore_links);
      warnings.push(...issues);
      return {
        trigger: TRIGGER.keyword,
        metadata: {
          keyword_filter: ["*http://*", "*https://*"],
          ...(words.length > 0 ? { allow_list: words.slice(0, AUTOMOD_LIMITS.allow) } : {}),
        },
      };
    }

    case "keywords": {
      const { keywords, regex, allow } = settings.keywords;
      const metadata: Record<string, unknown> = {};
      const words = clean(keywords)
        .filter((word) => word.length <= AUTOMOD_LIMITS.keywordLength)
        .slice(0, AUTOMOD_LIMITS.keywords);
      const patterns = clean(regex)
        .filter((pattern) => pattern.length <= AUTOMOD_LIMITS.regexLength)
        .slice(0, AUTOMOD_LIMITS.regex);
      const allowed = clean(allow)
        .filter((word) => word.length <= AUTOMOD_LIMITS.keywordLength)
        .slice(0, AUTOMOD_LIMITS.allow);

      if (words.length > 0) metadata.keyword_filter = words;
      if (patterns.length > 0) metadata.regex_patterns = patterns;
      if (allowed.length > 0) metadata.allow_list = allowed;
      return { trigger: TRIGGER.keyword, metadata };
    }

    case "profanity": {
      const presets = (settings.profanity.presets ?? [])
        .map((preset) => PRESET_ID[preset])
        .filter((id): id is number => typeof id === "number");
      const allowed = clean(settings.profanity.allow)
        .filter((word) => word.length <= AUTOMOD_LIMITS.keywordLength)
        .slice(0, AUTOMOD_LIMITS.allow);

      return {
        trigger: TRIGGER.preset,
        metadata: {
          presets: presets.length > 0 ? [...new Set(presets)] : [PRESET_ID.profanity],
          ...(allowed.length > 0 ? { allow_list: allowed } : {}),
        },
      };
    }

    case "mention_spam": {
      const limit = Math.min(
        Math.max(Math.floor(Number(settings.mention_spam.limit)) || 5, 1),
        AUTOMOD_LIMITS.mentionLimit,
      );
      return {
        trigger: TRIGGER.mentionSpam,
        metadata: {
          mention_total_limit: limit,
          mention_raid_protection_enabled: Boolean(settings.mention_spam.raid_protection),
        },
      };
    }

    case "spam":
      return { trigger: TRIGGER.spam, metadata: {} };
  }
}

/** The AutoMod rule that enforces one kind of the settings. */
export function buildAutoModRule(
  kind: AutoModKind,
  settings: AutoModerationSettings,
  moderationRoles: string[] = [],
): BuiltRule {
  const rule = settings[kind] as AutoModRuleBase;
  const warnings: AutoModIssue[] = [];
  const { trigger, metadata } = metadataFor(kind, settings, warnings);

  const roles = clean([
    ...(rule.ignore_roles ?? []),
    ...(rule.moderation_immune ? moderationRoles : []),
  ]);
  if (roles.length > AUTOMOD_LIMITS.exemptRoles) {
    warnings.push({
      kind,
      code: "ignore_roles_truncated",
      params: { max: AUTOMOD_LIMITS.exemptRoles },
    });
  }

  const channels = clean(rule.ignore_channels).slice(0, AUTOMOD_LIMITS.exemptChannels);

  return {
    body: {
      name: AUTOMOD_RULE_NAMES[kind],
      event_type: EVENT_MESSAGE_SEND,
      trigger_type: trigger,
      trigger_metadata: metadata,
      actions: actionsFor(kind, rule),
      enabled: true,
      exempt_roles: roles.slice(0, AUTOMOD_LIMITS.exemptRoles),
      exempt_channels: channels,
    },
    warnings,
    nativeTimeout: nativeTimeoutSeconds(kind, rule) !== null,
    driver: autoModDriver(kind, rule),
  };
}

/** The kind a Discord rule id belongs to, or `null` for a rule somebody else made. */
export function kindOfRule(
  rules: AutoModerationSettings["rules"] | undefined,
  ruleId: string,
): AutoModKind | null {
  for (const kind of AUTOMOD_KINDS) {
    if (rules?.[kind] === ruleId) return kind;
  }
  return null;
}

// ---- Talking to Discord --------------------------------------------------------------------

export interface DiscordAutoModRule extends DiscordAutoModRuleBody {
  id: string;
}

/** Thrown by a transport; `status` is the HTTP status and `code` Discord's JSON error code. */
export interface AutoModApiError {
  status?: number;
  code?: number;
  message: string;
}

export interface AutoModTransport {
  list(): Promise<DiscordAutoModRule[]>;
  create(body: DiscordAutoModRuleBody): Promise<DiscordAutoModRule>;
  edit(id: string, body: Partial<DiscordAutoModRuleBody>): Promise<DiscordAutoModRule>;
  remove(id: string): Promise<void>;
}

export type AutoModErrorKind = "permissions" | "limit" | "invalid" | "unknown";

export interface AutoModFailure {
  kind: AutoModErrorKind;
  status?: number;
  code?: number;
  message: string;
}

/** Sort a failed request into something the dashboard can explain. */
export function describeAutoModError(error: unknown): AutoModFailure {
  const err = (error ?? {}) as Partial<AutoModApiError> & { rawError?: { message?: string } };
  const status = typeof err.status === "number" ? err.status : undefined;
  const code = typeof err.code === "number" ? err.code : undefined;
  const message = err.message || err.rawError?.message || "Unknown error";

  let kind: AutoModErrorKind = "unknown";
  if (status === 403 || code === 50001 || code === 50013) kind = "permissions";
  else if (code === 30032 || code === 30033) kind = "limit";
  else if (status === 400 || code === 50035) kind = "invalid";

  return { kind, status, code, message };
}

export type AutoModKindStatus =
  | "created"
  | "updated"
  | "removed"
  | "unchanged"
  | "disabled"
  /** Enabled in the settings, but the rule is gone from Discord (somebody deleted it there). */
  | "missing"
  | "error";

export interface AutoModKindResult {
  status: AutoModKindStatus;
  error?: AutoModFailure;
  warnings: AutoModIssue[];
}

export interface AutoModSyncResult {
  /** The rule ids to store, by kind. */
  rules: AutoModerationSettings["rules"];
  results: Record<AutoModKind, AutoModKindResult>;
  /** The whole sync failed before any rule was touched (usually missing permissions). */
  listError?: AutoModFailure;
}

export interface AutoModSyncOptions {
  transport: AutoModTransport;
  settings: AutoModerationSettings;
  moderationRoles?: string[];
  /**
   * `apply` makes Discord match the settings (the dashboard saved something).
   * `reconcile` only creates what was never created and reports what vanished, it never overwrites
   * a rule an administrator edited in Discord (the bot runs it at startup).
   */
  mode: "apply" | "reconcile";
}

export async function syncAutoModeration(options: AutoModSyncOptions): Promise<AutoModSyncResult> {
  const { transport, settings, mode } = options;
  const moderationRoles = options.moderationRoles ?? [];
  const rules: AutoModerationSettings["rules"] = { ...(settings.rules ?? {}) };
  const results = {} as Record<AutoModKind, AutoModKindResult>;

  for (const kind of AUTOMOD_KINDS) results[kind] = { status: "unchanged", warnings: [] };

  let existing: DiscordAutoModRule[];
  try {
    existing = await transport.list();
  } catch (error) {
    const failure = describeAutoModError(error);
    for (const kind of AUTOMOD_KINDS) {
      results[kind] = { status: settings[kind]?.enabled ? "error" : "disabled", error: failure, warnings: [] };
    }
    return { rules, results, listError: failure };
  }

  const byId = new Map(existing.map((rule) => [rule.id, rule]));
  const byName = new Map(existing.map((rule) => [rule.name, rule]));
  const findRule = (kind: AutoModKind): DiscordAutoModRule | undefined => {
    const id = rules[kind];
    return (id ? byId.get(id) : undefined) ?? byName.get(AUTOMOD_RULE_NAMES[kind]);
  };

  // Removals first: they free the per-server quota (Discord caps the rules of every type).
  for (const kind of AUTOMOD_KINDS) {
    if (settings[kind]?.enabled) continue;

    const found = findRule(kind);
    if (mode === "reconcile" || !found) {
      results[kind].status = "disabled";
      continue;
    }

    try {
      await transport.remove(found.id);
      delete rules[kind];
      results[kind].status = "removed";
    } catch (error) {
      results[kind] = { status: "error", error: describeAutoModError(error), warnings: [] };
    }
  }

  for (const kind of AUTOMOD_KINDS) {
    if (!settings[kind]?.enabled) continue;

    const found = findRule(kind);

    if (mode === "reconcile") {
      if (found) {
        rules[kind] = found.id;
        results[kind].status = "unchanged";
        continue;
      }
      if (rules[kind]) {
        results[kind].status = "missing";
        continue;
      }
    }

    const built = buildAutoModRule(kind, settings, moderationRoles);
    results[kind].warnings = built.warnings;

    try {
      if (found) {
        const { trigger_type: _trigger, ...patch } = built.body;
        const updated = await transport.edit(found.id, patch);
        rules[kind] = updated.id;
        results[kind].status = "updated";
      } else {
        const created = await transport.create(built.body);
        rules[kind] = created.id;
        results[kind].status = "created";
      }
    } catch (error) {
      results[kind].status = "error";
      results[kind].error = describeAutoModError(error);
    }
  }

  return { rules, results };
}
