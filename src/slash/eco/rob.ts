import { SlashCommand } from "../../types/helpers";
import { Client, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { defaultPermissions, Guild, User } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "rob",
  description: "Attempt to rob another user.",
  cooldown: 3,
  locale: {
    ru: "Попытаться ограбить другого пользователя.",
  },
  options: [
    {
      name: "user",
      description: "The user to rob",
      type: "USER",
      required: true,
      local: {
        ru: "Пользователь для ограбления",
      },
    },
  ],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply();

    const guild = new Guild(client, interaction.guild);
    const user = new User(client, interaction.user, interaction.guild);
    const lang = await guild.get("settings.language");

    // Check if rob is enabled
    const robSettings = await guild.get("economy.income.rob");
    if (!robSettings.enabled) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.rob.messages.disabled")),
        ],
      });
    }

    // Get target user
    const targetUser = interaction.options.getUser("user", true);

    // Can't rob yourself
    if (targetUser.id === interaction.user.id) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.rob.messages.self")),
        ],
      });
    }

    // Can't rob bots
    if (targetUser.bot) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(t(client, lang, "commands.rob.messages.bot")),
        ],
      });
    }

    // Check cooldown
    const lastRob = await user.get("economy.timeout.rob");
    const now = Date.now();
    const cooldownMs = robSettings.cooldown * 1000;

    if (lastRob && now - lastRob < cooldownMs) {
      const remaining = Math.ceil((lastRob + cooldownMs - now) / 1000);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(
              t(client, lang, "commands.rob.messages.cooldown", formatTime(remaining, lang)),
            ),
        ],
      });
    }

    // Get target user data
    const target = new User(client, targetUser, interaction.guild);
    const targetWallet = await target.get("economy.balance.wallet");

    // Check if target has money
    if (targetWallet <= 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.error)
            .setDescription(
              t(client, lang, "commands.rob.messages.no_money", targetUser.toString()),
            ),
        ],
      });
    }

    // Get currency emoji
    const currency = await guild.get("economy.currency");
    const currencyEmoji = currency.emoji || "💰";

    // Get user's wallet for potential fine
    const userWallet = await user.get("economy.balance.wallet");

    // Calculate success/failure
    const failChance = robSettings.punishment.fail_chance / 100;
    const isSuccess = Math.random() > failChance;

    // Update cooldown regardless of outcome
    await user.set("economy.timeout.rob", now);

    if (isSuccess) {
      // Calculate stolen amount
      let stolenAmount: number;
      if (robSettings.income.type === "percentage") {
        const percentage =
          Math.random() * (robSettings.income.max - robSettings.income.min) +
          robSettings.income.min;
        stolenAmount = Math.floor(targetWallet * (percentage / 100));
      } else {
        stolenAmount =
          Math.floor(Math.random() * (robSettings.income.max - robSettings.income.min + 1)) +
          robSettings.income.min;
      }

      // Make sure we don't steal more than they have
      stolenAmount = Math.min(stolenAmount, targetWallet);

      // Update balances
      await user.set("economy.balance.wallet", userWallet + stolenAmount);
      await target.set("economy.balance.wallet", targetWallet - stolenAmount);

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
            "commands.rob.messages.success",
            targetUser.toString(),
            `${currencyEmoji} ${stolenAmount}`,
          ),
        );

      await interaction.editReply({ embeds: [embed] });
    } else {
      // Calculate fine
      let fineAmount: number;
      if (robSettings.punishment.type === "percentage") {
        const percentage =
          Math.random() * (robSettings.punishment.max - robSettings.punishment.min) +
          robSettings.punishment.min;
        fineAmount = Math.floor(userWallet * (percentage / 100));
      } else {
        fineAmount =
          Math.floor(
            Math.random() * (robSettings.punishment.max - robSettings.punishment.min + 1),
          ) + robSettings.punishment.min;
      }

      // Make sure we don't fine more than they have
      fineAmount = Math.min(fineAmount, userWallet);

      // Update balance
      await user.set("economy.balance.wallet", userWallet - fineAmount);

      const embed = new EmbedBuilder()
        .setColor(client.holder.colors.error)
        .setAuthor({
          name: interaction.user.displayName,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          t(
            client,
            lang,
            "commands.rob.messages.fail",
            targetUser.toString(),
            `${currencyEmoji} ${fineAmount}`,
          ),
        );

      await interaction.editReply({ embeds: [embed] });
    }
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
