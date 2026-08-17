import { SlashCommand } from "../../types/helpers";
import { Client, ChatInputCommandInteraction } from "discord.js";
import { defaultPermissions } from "../../helpers";
import { prepareModeration, replyError } from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "case",
  description: "🔍 Show a moderation case by its number.",
  cooldown: 3,
  locale: {
    ru: "🔍 Показать дело модерации по его номеру.",
    uk: "🔍 Показати справу модерації за її номером.",
  },
  options: [
    {
      name: "number",
      description: "Case number",
      required: true,
      type: "INTEGER",
      min: 1,
      max: 1000000,
      local: { ru: "Номер дела", uk: "Номер справи" },
    },
  ],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    await interaction.deferReply();

    const caseNumber = interaction.options.getInteger("number", true);
    const entry = await ctx.service.getCase(caseNumber);

    if (!entry) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.case.not_found", String(caseNumber)),
      );
    }

    await interaction.editReply({
      embeds: [await ctx.service.buildCaseEmbed(entry, ctx.lang)],
    });
  },
} as SlashCommand;
