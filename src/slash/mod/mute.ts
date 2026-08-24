import { SlashCommand } from "../../types/helpers";
import {Client, ChatInputCommandInteraction, PermissionsBitField, MessageFlags, MessageFlagsBitField} from "discord.js";
import { defaultPermissions } from "../../helpers";
import {
  ensureCanActOn,
  parseDuration,
  prepareModeration,
  replyError,
  replySuccess,
  resolveReason,
} from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "mute",
  description: "🔇 Time out a member.",
  cooldown: 3,
  locale: {
    ru: "🔇 Выдать участнику мут (тайм-аут).",
    uk: "🔇 Видати учаснику мут (тайм-аут).",
  },
  options: [
    {
      name: "user",
      description: "Member to mute",
      required: true,
      type: "USER",
      local: { ru: "Участник, которому выдаётся мут", uk: "Учасник, якому видається мут" },
    },
    {
      name: "duration",
      description: "Duration, for example 30m, 2h or 7d (max 28d)",
      required: true,
      type: "STRING",
      local: {
        ru: "Длительность, например 30m, 2h или 7d (макс. 28d)",
        uk: "Тривалість, наприклад 30m, 2h або 7d (макс. 28d)",
      },
    },
    {
      name: "reason",
      description: "Reason for the mute",
      required: false,
      type: "STRING",
      local: { ru: "Причина мута", uk: "Причина муту" },
    },
  ],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ModerateMembers],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    const user = interaction.options.getUser("user", true);
    const duration = parseDuration(interaction.options.getString("duration", true));

    if (!duration) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.invalid_duration"),
      );
    }

    const member = await ctx.service.fetchMember(user.id);
    if (!member) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "moderation.errors.member_not_found"),
      );
    }

    if (
      member.communicationDisabledUntilTimestamp &&
      member.communicationDisabledUntilTimestamp > Date.now()
    ) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.mute.already"),
      );
    }

    if (!(await ensureCanActOn(client, interaction, ctx, member))) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const result = await ctx.service.punish({
      type: "mute",
      targetId: user.id,
      moderatorId: interaction.user.id,
      reason: resolveReason(client, interaction, ctx.lang),
      duration,
    });

    if (!result.ok) {
      return replyError(client, interaction, ctx.lang, result.error);
    }

    await replySuccess(
      client,
      interaction,
      ctx.lang,
      t(
        client,
        ctx.lang,
        "commands.mod.mute.success",
        user.toString(),
        await ctx.service.formatDuration(result.case.duration ?? duration, ctx.lang),
        String(result.case.caseNumber),
      ),
    );
  },
} as SlashCommand;
