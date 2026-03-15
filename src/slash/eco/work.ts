import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, EmbedBuilder, MessageFlagsBitField } from "discord.js";
import { defaultPermissions, Guild, User } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "work",
  description: "⛏️ Work to earn some money.",
  cooldown: 3,
  locale: {
    ru: "⛏️ Работайте, чтобы заработать деньги.",
    uk: "⛏️ Працюйте, щоб заробити гроші.",
  },
  options: [],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply();

    const guild = new Guild(client, interaction.guild);
    const user = new User(client, interaction.user, interaction.guild);
    const lang = await guild.get("settings.language");

    // Check if work is enabled
    const workSettings = await guild.get("economy.income.work");
    if (!workSettings.enabled) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.work.messages.disabled")),
        ],
      });
    }

    // Check cooldown
    const lastWork = await user.get("economy.timeout.work");
    const now = Date.now();
    const cooldownMs = workSettings.cooldown * 1000;

    if (lastWork && now - lastWork < cooldownMs) {
      const remaining = Math.ceil((lastWork + cooldownMs - now) / 1000);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(
              t(client, lang, "commands.work.messages.cooldown", formatTime(remaining, lang)),
            ),
        ],
      });
    }

    // Calculate reward
    const reward =
      Math.floor(Math.random() * (workSettings.max - workSettings.min + 1)) + workSettings.min;

    // Get currency emoji
    const currency = await guild.get("economy.currency");
    const currencyEmoji = currency.emoji || client.holder.emojis.discord.gems;

    // Update user balance and cooldown
    const currentBalance = await user.get("economy.balance.wallet");
    await user.set("economy.balance.wallet", currentBalance + reward);
    await user.set("economy.timeout.work", now);

    // Random work message
    const workMessages = getWorkMessages(lang);
    const randomMessage = workMessages[Math.floor(Math.random() * workMessages.length)];

    const embed = new EmbedBuilder()
      .setColor(client.holder.colors.success)
      .setAuthor({
        name: interaction.user.displayName,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription(
        t(
          client,
          lang,
          "commands.work.messages.success",
          randomMessage,
          `${currencyEmoji} ${reward}`,
        ),
      );

    await interaction.editReply({ embeds: [embed] });
  },
} as SlashCommand;

function formatTime(seconds: number, lang: string): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}${lang === "ru" ? "ч" : "h"}`);
  if (minutes > 0) parts.push(`${minutes}${lang === "ru" ? "м" : "m"}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}${lang === "ru" ? "с" : "s"}`);

  return parts.join(" ");
}

function getWorkMessages(lang: string): string[] {
  if (lang === "ru") {
    return [
      "Вы работали программистом и исправили баг",
      "Вы доставили пиццу вовремя",
      "Вы написали статью для блога",
      "Вы помогли соседу с ремонтом",
      "Вы продали лимонад на углу",
      "Вы выгуляли чужую собаку",
      "Вы работали на стройке",
      "Вы провели урок музыки",
      "Вы починили чей-то компьютер",
      "Вы убрали офис после вечеринки",
    ];
  }
  return [
    "You worked as a programmer and fixed a bug",
    "You delivered pizza on time",
    "You wrote an article for a blog",
    "You helped a neighbor with repairs",
    "You sold lemonade on the corner",
    "You walked someone's dog",
    "You worked at a construction site",
    "You gave a music lesson",
    "You fixed someone's computer",
    "You cleaned the office after a party",
  ];
}
