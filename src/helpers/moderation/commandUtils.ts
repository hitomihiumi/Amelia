import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GuildMember,
  MessageFlagsBitField,
} from "discord.js";
import { Guild } from "../Guild";
import { ModerationService } from "./ModerationService";
import { canActOn, isModerator } from "./checks";
import { t } from "../../i18n/helpers";

export interface ModerationContext {
  guild: Guild;
  service: ModerationService;
  member: GuildMember;
  lang: string;
}

/**
 * Shared entry point for every `/mod` subcommand: resolves the guild context and
 * makes sure the caller is allowed to moderate. Replies with an error and
 * returns `null` when the command must not continue.
 */
export async function prepareModeration(
  client: Client,
  interaction: ChatInputCommandInteraction,
): Promise<ModerationContext | null> {
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) return null;

  const guild = new Guild(client, interaction.guild);
  const lang = await guild.get("settings.language");

  if (!(await isModerator(guild, interaction.member))) {
    await interaction.reply({
      embeds: [client.holder.embed.error(lang, t(client, lang, "moderation.errors.no_permission"))],
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });
    return null;
  }

  return {
    guild,
    service: new ModerationService(client, interaction.guild),
    member: interaction.member,
    lang,
  };
}

/**
 * Verify that the moderator outranks the target.
 * Returns `false` (after replying) when the action must be aborted.
 */
export async function ensureCanActOn(
  client: Client,
  interaction: ChatInputCommandInteraction,
  ctx: ModerationContext,
  target: GuildMember,
): Promise<boolean> {
  const blocked = canActOn(ctx.member, target);
  if (!blocked) return true;

  await replyError(
    client,
    interaction,
    ctx.lang,
    t(client, ctx.lang, `moderation.errors.${blocked}`),
  );
  return false;
}

/** Reply (or edit the deferred reply) with an error embed. */
export async function replyError(
  client: Client,
  interaction: ChatInputCommandInteraction,
  lang: string,
  description: string,
): Promise<void> {
  const payload = { embeds: [client.holder.embed.error(lang, description)] };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
    return;
  }

  await interaction.reply({ ...payload, flags: MessageFlagsBitField.Flags.Ephemeral });
}

/** Reply (or edit the deferred reply) with a success embed. */
export async function replySuccess(
  client: Client,
  interaction: ChatInputCommandInteraction,
  lang: string,
  description: string,
  extra?: EmbedBuilder[],
): Promise<void> {
  const embeds = [client.holder.embed.success(lang, description), ...(extra ?? [])];

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds });
    return;
  }

  await interaction.reply({ embeds });
}

/** The reason option is optional everywhere; fall back to the localized default. */
export function resolveReason(
  client: Client,
  interaction: ChatInputCommandInteraction,
  lang: string,
): string {
  const reason = interaction.options.getString("reason");
  return (reason ?? "").trim() || t(client, lang, "moderation.case.no_reason");
}
