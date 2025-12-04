import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { defaultPermissions, Guild, User } from "../../helpers";
import { t } from "../../i18n/helpers";

const TIMELY_COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds

module.exports = {
  name: "timely",
  description: "Claim your hourly reward.",
  cooldown: 3,
  locale: {
    ru: "Получите свою ежечасную награду.",
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

    // Check if timely is enabled
    const timelySettings = await guild.get("economy.income.timely");
    if (!timelySettings.enabled) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.timely.messages.disabled")),
        ],
      });
    }

    // Check cooldown
    const lastTimely = await user.get("economy.timeout.timely");
    const now = Date.now();

    if (lastTimely && now - lastTimely < TIMELY_COOLDOWN) {
      const remaining = Math.ceil((lastTimely + TIMELY_COOLDOWN - now) / 1000);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(
              t(client, lang, "commands.timely.messages.cooldown", formatTime(remaining, lang)),
            ),
        ],
      });
    }

    // Get currency emoji
    const currency = await guild.get("economy.currency");
    const currencyEmoji = currency.emoji || "💰";

    // Update user balance and cooldown
    const currentBalance = await user.get("economy.balance.wallet");
    await user.set("economy.balance.wallet", currentBalance + timelySettings.amount);
    await user.set("economy.timeout.timely", now);

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
          "commands.timely.messages.success",
          `${currencyEmoji} ${timelySettings.amount}`,
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
