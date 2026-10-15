import { SlashCommand } from "../../types/helpers";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlagsBitField,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "slots",
  description: "🎰 Open the slot machine (virtual currency only).",
  cooldown: 3,
  locale: {
    ru: "🎰 Открыть слот-машину (только виртуальная валюта).",
    uk: "🎰 Відкрити слот-машину (лише віртуальна валюта).",
  },
  options: [],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    // Only the person who asked sees the link and the reminder, nothing is posted into the channel.
    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    const slots = await guild.get("economy.income.slots");
    if (!slots.enabled) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.slots.messages.disabled")),
        ],
      });
    }

    const currency = await guild.get("economy.currency");
    const currencyEmoji = currency.emoji || client.holder.emojis.discord.gems;

    const embed = new EmbedBuilder()
      .setColor(client.holder.colors.default)
      .setTitle(t(client, lang, "commands.slots.messages.title"))
      .setDescription(t(client, lang, "commands.slots.messages.description"))
      .addFields(
        {
          name: t(client, lang, "commands.slots.messages.bets_name"),
          value: t(
            client,
            lang,
            "commands.slots.messages.bets_value",
            `${currencyEmoji} ${slots.min_bet}`,
            `${currencyEmoji} ${slots.max_bet}`,
          ),
          inline: true,
        },
        {
          name: t(client, lang, "commands.slots.messages.cooldown_name"),
          value: t(
            client,
            lang,
            "commands.slots.messages.cooldown_value",
            slots.cooldown.toString(),
          ),
          inline: true,
        },
        {
          name: t(client, lang, "commands.slots.messages.warning_title"),
          value: t(client, lang, "commands.slots.messages.warning"),
        },
      );

    const base = process.env.DASHBOARD_URL;
    if (!base) {
      embed.setFooter({ text: t(client, lang, "commands.slots.messages.no_dashboard") });
      return interaction.editReply({ embeds: [embed] });
    }

    const url = `${base.replace(/\/+$/, "")}/profile/slots/${interaction.guild.id}`;
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(url)
        .setLabel(t(client, lang, "commands.slots.messages.open_button")),
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  },
} as SlashCommand;
