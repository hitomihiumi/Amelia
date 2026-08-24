import { SlashCommand, ModerationForm } from "../../types/helpers";
import {
  Client,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";
import { defaultPermissions } from "../../helpers";
import { prepareModeration, replyError } from "../../helpers/moderation";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "link",
  description: "🔗 Show the links to the report and appeal forms.",
  cooldown: 3,
  locale: {
    ru: "🔗 Показать ссылки на формы жалоб и обжалований.",
    uk: "🔗 Показати посилання на форми скарг та оскаржень.",
  },
  options: [],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    const ctx = await prepareModeration(client, interaction);
    if (!ctx) return;

    const reportUrl = ctx.service.reportUrl();
    const appealUrl = ctx.service.appealUrl();

    if (!reportUrl || !appealUrl) {
      return replyError(
        client,
        interaction,
        ctx.lang,
        t(client, ctx.lang, "commands.mod.link.not_configured"),
      );
    }

    const report = (await ctx.guild.get("moderation.forms.report")) as ModerationForm;
    const appeal = (await ctx.guild.get("moderation.forms.appeal")) as ModerationForm;
    const disabled = t(client, ctx.lang, "commands.mod.link.disabled");

    const embed = new EmbedBuilder()
      .setColor(client.holder.colors.default as any)
      .setTitle(t(client, ctx.lang, "commands.mod.link.title"))
      .addFields(
        {
          name: t(client, ctx.lang, "commands.mod.link.report"),
          value: report?.enabled ? reportUrl : `${reportUrl}\n*(${disabled})*`,
        },
        {
          name: t(client, ctx.lang, "commands.mod.link.appeal"),
          value: appeal?.enabled ? appealUrl : `${appealUrl}\n*(${disabled})*`,
        },
      );

    await interaction.reply({ embeds: [embed] });
  },
} as SlashCommand;
