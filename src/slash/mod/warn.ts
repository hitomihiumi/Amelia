import { SlashCommand } from "../../types/helpers";
import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
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
  name: "warn",
  description: "⚠️ Warn a member.",
  cooldown: 3,
  locale: {
    ru: "⚠️ Выдать участнику предупреждение.",
    uk: "⚠️ Видати учаснику попередження.",
  },
  options: [
    {
      name: "user",
      description: "Member to warn",
      required: true,
      type: "USER",
      local: {
        ru: "Участник, которому выдаётся предупреждение",
        uk: "Учасник, якому видається попередження",
      },
    },
    {
      name: "reason",
      description: "Reason for the warn",
      required: false,
      type: "STRING",
      local: { ru: "Причина предупреждения", uk: "Причина попередження" },
    },
  ],
  permissions: {
    bot: defaultPermissions,
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

    if (!(await ensureCanActOn(client, interaction, ctx, member as GuildMember))) return;

    await interaction.deferReply();

    const reason = resolveReason(client, interaction, ctx.lang);
    const result = await ctx.service.punish({
      type: "warn",
      targetId: user.id,
      moderatorId: interaction.user.id,
      reason,
    });

    if (!result.ok) {
      return replyError(client, interaction, ctx.lang, result.error);
    }

    const extra = result.escalated
      ? [await ctx.service.buildCaseEmbed(result.escalated, ctx.lang)]
      : [];

    await replySuccess(
      client,
      interaction,
      ctx.lang,
      t(
        client,
        ctx.lang,
        "commands.mod.warn.success",
        user.toString(),
        String(result.case.caseNumber),
      ),
      extra,
    );
  },
} as SlashCommand;
