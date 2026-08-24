import { SlashCommand } from "../../types/helpers";
import {Client, ChatInputCommandInteraction, PermissionsBitField, MessageFlags, MessageFlagsBitField} from "discord.js";
import { defaultPermissions } from "../../helpers";
import {
  ensureCanActOn,
  prepareModeration,
  replyError,
  replySuccess,
  resolveReason,
} from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "kick",
  description: "👢 Kick a member from the server.",
  cooldown: 3,
  locale: {
    ru: "👢 Исключить участника с сервера.",
    uk: "👢 Виключити учасника із сервера.",
  },
  options: [
    {
      name: "user",
      description: "Member to kick",
      required: true,
      type: "USER",
      local: { ru: "Участник для исключения", uk: "Учасник для виключення" },
    },
    {
      name: "reason",
      description: "Reason for the kick",
      required: false,
      type: "STRING",
      local: { ru: "Причина исключения", uk: "Причина виключення" },
    },
  ],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.KickMembers],
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

    if (!(await ensureCanActOn(client, interaction, ctx, member))) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const result = await ctx.service.punish({
      type: "kick",
      targetId: user.id,
      moderatorId: interaction.user.id,
      reason: resolveReason(client, interaction, ctx.lang),
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
        "commands.mod.kick.success",
        user.toString(),
        String(result.case.caseNumber),
      ),
    );
  },
} as SlashCommand;
