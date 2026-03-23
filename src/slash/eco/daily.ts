import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { defaultPermissions, Guild, User } from "../../helpers";
import { t } from "../../i18n/helpers";

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

module.exports = {
  name: "daily",
  description: "⏰ Claim your daily reward.",
  cooldown: 3,
  locale: {
    ru: "⏰ Получите свою ежедневную награду.",
    uk: "⏰ Отримайте свою щоденну нагороду.",
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

    // Check if daily is enabled
    const dailySettings = await guild.get("economy.income.daily");
    if (!dailySettings.enabled) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.daily.messages.disabled")),
        ],
      });
    }

    // Check cooldown
    const lastDaily = await user.get("economy.timeout.daily");
    const now = Date.now();

    if (lastDaily && now - lastDaily < DAILY_COOLDOWN) {
      const remaining = Math.ceil((lastDaily + DAILY_COOLDOWN - now) / 1000);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(
              t(client, lang, "commands.daily.messages.cooldown", formatTime(remaining, lang)),
            ),
        ],
      });
    }

    // Get currency emoji
    const currency = await guild.get("economy.currency");
    const currencyEmoji = currency.emoji || client.holder.emojis.discord.gems;

    // Update user balance and cooldown
    const currentBalance = await user.get("economy.balance.wallet");
    await user.set("economy.balance.wallet", currentBalance + dailySettings.amount);
    await user.set("economy.timeout.daily", now);

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
          "commands.daily.messages.success",
          `${currencyEmoji} ${dailySettings.amount}`,
        ),
      );

    await interaction.editReply({ embeds: [embed] });
  },
} as SlashCommand;

function formatTime(seconds: number, lang: string): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${lang === "ru" ? "д" : "d"}`);
  if (hours > 0) parts.push(`${hours}${lang === "ru" ? "ч" : "h"}`);
  if (minutes > 0) parts.push(`${minutes}${lang === "ru" ? "м" : "m"}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}${lang === "ru" ? "с" : "s"}`);

  return parts.join(" ");
}
