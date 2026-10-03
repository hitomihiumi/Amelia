import { Client, GuildMember, Message } from "discord.js";
import { Guild } from "../helpers";
import { ModerationService, isLinkIgnored, isModerator } from "../helpers/moderation";
import { AuditLogger } from "../helpers/audit";
import { GuildSchema, ModerationCaseType, Punishment } from "../types/helpers";
import { t } from "../i18n/helpers";

type AutoModeration = GuildSchema["moderation"]["auto_moderation"];

/** discord.gg / discord.com/invite / dsc.gg style invites. */
const INVITE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.com\/invite|discord\.gg|discord\.me|dsc\.gg|invite\.gg)\/[a-z0-9-_]+/i;

/** Any http(s) link. */
const LINK_REGEX = /https?:\/\/([^\s/$.?#]+\.[^\s]*)/gi;

/**
 * Run auto moderation for a message.
 * Returns `true` when the message was handled (and most likely deleted), so the
 * caller can stop processing it.
 */
export async function runAutoModeration(client: Client, message: Message): Promise<boolean> {
  if (!message.guild || !message.member || message.author.bot) return false;

  const guild = new Guild(client, message.guild);
  const settings = (await guild.get("moderation.auto_moderation")) as AutoModeration;

  if (!settings) return false;

  if (settings.invite?.enabled && INVITE_REGEX.test(message.content)) {
    const handled = await enforce(client, guild, message, settings.invite, "invite");
    if (handled) return true;
  }

  if (settings.links?.enabled) {
    const links = extractLinks(message.content, settings.links.ignore_links ?? []);
    if (links.length > 0) {
      const handled = await enforce(client, guild, message, settings.links, "links");
      if (handled) return true;
    }
  }

  return false;
}

/** Links that are not whitelisted by the guild. */
function extractLinks(content: string, ignored: string[]): string[] {
  LINK_REGEX.lastIndex = 0;

  const matches = [...content.matchAll(LINK_REGEX)].map((match) => match[0]);
  if (matches.length === 0) return [];

  return matches.filter((link) => !isLinkIgnored(link, ignored));
}

interface AutoModRule {
  ignore_channels: string[];
  ignore_roles: string[];
  delete_message: boolean;
  moderation_immune: boolean;
  punishment: Punishment;
}

/** Apply one auto moderation rule to a message. */
async function enforce(
  client: Client,
  guild: Guild,
  message: Message,
  rule: AutoModRule,
  kind: "invite" | "links",
): Promise<boolean> {
  const member = message.member as GuildMember;

  if (rule.ignore_channels?.includes(message.channelId)) return false;
  if (rule.ignore_roles?.some((roleId) => member.roles.cache.has(roleId))) return false;
  if (rule.moderation_immune && (await isModerator(guild, member))) return false;

  const lang = await guild.get("settings.language");
  const reason =
    rule.punishment?.reason?.trim() ||
    t(
      client,
      lang,
      kind === "invite" ? "moderation.automod.invite_reason" : "moderation.automod.links_reason",
    );

  if (rule.delete_message && message.deletable) {
    // Tell the audit log why the message disappeared.
    AuditLogger.markDeletion(message.id, reason);
    await message.delete().catch(() => null);
  }

  const type = rule.punishment?.type as unknown as ModerationCaseType | undefined;
  if (type && ["warn", "mute", "kick", "ban"].includes(type)) {
    const service = new ModerationService(client, message.guild!);

    await service.punish({
      type,
      targetId: member.id,
      moderatorId: "AUTOMOD",
      reason,
      duration: rule.punishment.time || null,
      evidence: [message.url],
      source: "automod",
    });
  }

  return rule.delete_message;
}
