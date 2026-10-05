import {
  AutoModerationActionExecution,
  AutoModerationActionType,
  Client,
  Guild as DiscordGuild,
  Routes,
} from "discord.js";
import { Guild } from "../helpers";
import {
  AUTOMOD_KINDS,
  AutoModTransport,
  ModerationService,
  autoModDriver,
  kindOfRule,
  nativeTimeoutSeconds,
  syncAutoModeration,
} from "../helpers/moderation";
import type { AutoModKind, AutoModerationSettings, ModerationCaseType } from "../types/helpers";
import { t } from "../i18n/helpers";

/**
 * Auto moderation runs on Discord's native AutoMod, see `helpers/moderation/autoModeration.ts`.
 * Discord blocks the message, alerts and times out by itself; this file does the rest:
 * it records a case (and applies warn, kick and ban) when a rule fires, and it keeps the
 * rules of every server in place.
 */

const DRIVER_ACTION: Record<"block" | "alert" | "timeout", AutoModerationActionType> = {
  block: AutoModerationActionType.BlockMessage,
  alert: AutoModerationActionType.SendAlertMessage,
  timeout: AutoModerationActionType.Timeout,
};

const DEFAULT_REASON = "Auto moderation";

const REASON_KEY: Record<AutoModKind, string> = {
  invite: "moderation.automod.invite_reason",
  links: "moderation.automod.links_reason",
  keywords: "moderation.automod.keywords_reason",
  profanity: "moderation.automod.profanity_reason",
  mention_spam: "moderation.automod.mention_spam_reason",
  spam: "moderation.automod.spam_reason",
};

/** The Discord AutoMod endpoints of one server, in the shape the shared sync code expects. */
export function autoModTransport(client: Client, guildId: string): AutoModTransport {
  return {
    list: async () => (await client.rest.get(Routes.guildAutoModerationRules(guildId))) as any,
    create: async (body) =>
      (await client.rest.post(Routes.guildAutoModerationRules(guildId), { body })) as any,
    edit: async (id, body) =>
      (await client.rest.patch(Routes.guildAutoModerationRule(guildId, id), { body })) as any,
    remove: async (id) => {
      await client.rest.delete(Routes.guildAutoModerationRule(guildId, id));
    },
  };
}

/** Called when Discord reports that one of the rules of a server fired. */
export async function handleAutoModerationExecution(
  client: Client,
  execution: AutoModerationActionExecution,
): Promise<void> {
  const { guild } = execution;
  const guildData = new Guild(client, guild);
  const settings = (await guildData.get("moderation.auto_moderation")) as AutoModerationSettings;
  if (!settings) return;

  // A rule an administrator made by hand is not ours to punish for.
  const kind = kindOfRule(settings.rules, execution.ruleId);
  if (!kind) return;

  const rule = settings[kind];
  if (!rule?.enabled) return;

  // Discord sends one event per executed action; only one of them produces a case.
  if (execution.action.type !== DRIVER_ACTION[autoModDriver(kind, rule)]) return;

  const user = client.users.cache.get(execution.userId);
  if (user?.bot) return;

  const type = rule.punishment?.type as unknown as ModerationCaseType | undefined;
  if (!type || !["warn", "mute", "kick", "ban"].includes(type)) return;

  const lang = await guildData.get("settings.language");
  // The stored default ("Auto moderation") says nothing; the name of the rule that fired does.
  const custom = rule.punishment?.reason?.trim();
  const reason =
    custom && custom !== DEFAULT_REASON ? custom : t(client, lang, REASON_KEY[kind] as any);

  // The timeout of a rule is applied by Discord itself; its event says it happened.
  const nativeTimeout = type === "mute" ? nativeTimeoutSeconds(kind, rule) : null;

  await new ModerationService(client, guild).punish({
    type,
    targetId: execution.userId,
    moderatorId: "AUTOMOD",
    reason,
    duration: nativeTimeout ?? (rule.punishment.time || null),
    source: "automod",
    skipDiscordAction: nativeTimeout !== null,
  });
}

/**
 * Make sure the rules of a server exist.
 *
 * Servers that enabled the invite or link filter before auto moderation moved to Discord have
 * settings but no rule yet, so the rule is created here. A rule that was deleted in Discord
 * switches the setting off: the administrator's choice wins and the dashboard shows it as off.
 * A rule that exists is never touched, an administrator may have adjusted it in Discord.
 */
export async function reconcileAutoModeration(client: Client, discordGuild: DiscordGuild) {
  try {
    const guild = new Guild(client, discordGuild);
    const settings = (await guild.get("moderation.auto_moderation")) as AutoModerationSettings;
    if (!settings || !AUTOMOD_KINDS.some((kind) => settings[kind]?.enabled)) return;

    const moderationRoles = ((await guild.get("moderation.moderation_roles")) ?? []) as string[];
    const result = await syncAutoModeration({
      transport: autoModTransport(client, discordGuild.id),
      settings,
      moderationRoles,
      mode: "reconcile",
    });

    if (result.listError) {
      console.warn(
        `[automod] ${discordGuild.id}: cannot read the AutoMod rules (${result.listError.message}). ` +
          `The bot needs the Manage Server permission.`,
      );
      return;
    }

    for (const kind of AUTOMOD_KINDS) {
      const outcome = result.results[kind];
      if (outcome.status === "error") {
        console.warn(`[automod] ${discordGuild.id}: ${kind}: ${outcome.error?.message}`);
      } else if (outcome.status === "missing") {
        await switchOff(guild, settings, kind);
        delete result.rules[kind];
      }
    }

    await guild.set("moderation.auto_moderation.rules", result.rules);
  } catch (error) {
    console.warn(`[automod] ${discordGuild.id}: reconcile failed`, error);
  }
}

/** Turn a rule off in the settings (the invite and link rules keep their flag in its own column). */
async function switchOff(guild: Guild, settings: AutoModerationSettings, kind: AutoModKind) {
  if (kind === "invite" || kind === "links") {
    await guild.set(`moderation.auto_moderation.${kind}.enabled` as any, false);
    return;
  }
  await guild.set(`moderation.auto_moderation.${kind}` as any, { ...settings[kind], enabled: false });
}

export async function reconcileAllAutoModeration(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    await reconcileAutoModeration(client, guild);
  }
}
