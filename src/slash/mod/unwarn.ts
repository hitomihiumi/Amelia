import { SlashCommand } from "../../types/helpers";
import { Client, ChatInputCommandInteraction } from "discord.js";
import { defaultPermissions } from "../../helpers";
import {
  prepareModeration,
  replyError,
  replySuccess,
  resolveReason,
} from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "unwarn",
  description: "✅ Revoke an active case by its number.",
  cooldown: 3,
  locale: {
    ru: "✅ Отменить активное дело по его номеру.",
    uk: "✅ Скасувати активну справу за її номером.",
  },
  options: [
    {
      name: "case",
      description: "Case number to revoke",
      required: true,
      type: "INTEGER",
      min: 1,
      max: 1000000,
      local: { ru: "Номер дела для отмены", uk: "Номер справи для скасування" },
    },
    {
      name: "reason",
      description: "Reason for the revocation",
      required: false,
      type: "STRING",
      local: { ru: "Причина отмены", uk: "Причина скасування" },
    },
  ],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    await interaction.deferReply();

    const caseNumber = interaction.options.getInteger("case", true);

    const result = await ctx.service.revoke({
      caseNumber,
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
      t(client, ctx.lang, "commands.mod.unwarn.success", String(caseNumber)),
    );
  },
} as SlashCommand;
