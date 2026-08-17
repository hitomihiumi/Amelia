import { SlashCommand } from "../../types/helpers";
import { Client, ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import { defaultPermissions } from "../../helpers";
import {
  prepareModeration,
  replyError,
  replySuccess,
  resolveReason,
} from "../../helpers/moderation";
import { prisma } from "../../database";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "unmute",
  description: "🔊 Remove the time out from a member.",
  cooldown: 3,
  locale: {
    ru: "🔊 Снять мут с участника.",
    uk: "🔊 Зняти мут з учасника.",
  },
  options: [
    {
      name: "user",
      description: "Member to unmute",
      required: true,
      type: "USER",
      local: { ru: "Участник для снятия мута", uk: "Учасник для зняття муту" },
    },
    {
      name: "reason",
      description: "Reason for the unmute",
      required: false,
      type: "STRING",
      local: { ru: "Причина снятия мута", uk: "Причина зняття муту" },
    },
  ],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ModerateMembers],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    const user = interaction.options.getUser("user", true);
    const member = await ctx.service.fetchMember(user.id);

    if (!member) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.member_not_found"),
      );
    }

    const muted =
      member.communicationDisabledUntilTimestamp !== null &&
      member.communicationDisabledUntilTimestamp > Date.now();

    if (!muted) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.unmute.not_muted"),
      );
    }

    await interaction.deferReply();

    const reason = resolveReason(client, interaction, ctx.lang);

    const storedMute = await prisma.moderationCase.findFirst({
      where: { guildId: interaction.guild!.id, targetId: user.id, type: "mute", active: true },
      orderBy: { caseNumber: "desc" },
    });

    const result = storedMute
      ? await ctx.service.revoke({
          caseNumber: storedMute.caseNumber,
          moderatorId: interaction.user.id,
          reason,
        })
      : await (async () => {
          await member.timeout(null, reason).catch(() => null);
          return await ctx.service.punish({
            type: "unmute",
            targetId: user.id,
            moderatorId: interaction.user.id,
            reason,
          });
        })();

    if (!result.ok) {
      return replyError(client, interaction, ctx.lang, result.error);
    }

    await replySuccess(
      client,
      interaction,
      ctx.lang,
      t(client, ctx.lang, "commands.mod.unmute.success", user.toString()),
    );
  },
} as SlashCommand;
