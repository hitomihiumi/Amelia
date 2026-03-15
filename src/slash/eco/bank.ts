import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, EmbedBuilder } from "discord.js";
import { defaultPermissions, Guild, User } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "bank",
  description: "🏦 Deposit or withdraw money from your bank account.",
  cooldown: 3,
  locale: {
    ru: "🏦 Положить или снять деньги с банковского счёта.",
    uk: "🏦 Покласти або зняти гроші з банківського рахунку.",
  },
  options: [
    {
      name: "type",
      description: "Type of transaction (deposit or withdraw)",
      type: "STRING_CHOICE",
      choices: [
        { name: "Deposit", value: "deposit" },
        { name: "Withdraw", value: "withdraw" },
      ],
      required: true,
      local: {
        ru: "Тип транзакции (депозит или снятие)",
        uk: "Тип транзакції (депозит або зняття)",
      },
    },
    {
      name: "amount",
      description: "The amount (use 'all' for maximum)",
      type: "STRING",
      required: true,
      local: {
        ru: "Сумма (используйте 'all' для максимума)",
        uk: "Сума (використовуйте 'all' для максимуму)",
      },
    },
  ],
  permissions: {
    bot: defaultPermissions,
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild || !interaction.isChatInputCommand()) return;

    await interaction.deferReply();

    const guild = new Guild(client, interaction.guild);
    const user = new User(client, interaction.user, interaction.guild);
    const lang = await guild.get("settings.language");

    const transactionType = interaction.options.getString("type", true);
    const amountStr = interaction.options.getString("amount", true).toLowerCase();

    // Get current balance
    const balance = await user.get("economy.balance");
    const wallet = balance.wallet;
    const bank = balance.bank;

    // Get currency emoji
    const currency = await guild.get("economy.currency");
    const currencyEmoji = currency.emoji || client.holder.emojis.discord.gems;

    if (transactionType === "deposit") {
      // Calculate amount to deposit
      let amount: number;
      if (amountStr === "all" || amountStr === "max" || amountStr === "все") {
        amount = wallet;
      } else {
        amount = parseInt(amountStr);
        if (isNaN(amount) || amount <= 0) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.holder.colors.error)
                .setDescription(t(client, lang, "commands.bank.messages.invalid_amount")),
            ],
          });
        }
      }

      // Check if user has enough money
      if (amount > wallet) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.holder.colors.error)
              .setDescription(
                t(
                  client,
                  lang,
                  "commands.bank.messages.insufficient_wallet",
                  `${currencyEmoji} ${wallet.toLocaleString()}`,
                ),
              ),
          ],
        });
      }

      // Check if amount is 0
      if (amount === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.holder.colors.error)
              .setDescription(t(client, lang, "commands.bank.messages.no_money_wallet")),
          ],
        });
      }

      // Perform deposit
      await user.set("economy.balance.wallet", wallet - amount);
      await user.set("economy.balance.bank", bank + amount);

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
            "commands.bank.messages.deposit_success",
            `${currencyEmoji} ${amount.toLocaleString()}`,
          ),
        )
        .addFields(
          {
            name: t(client, lang, "commands.bank.fields.wallet"),
            value: `${currencyEmoji} ${(wallet - amount).toLocaleString()}`,
            inline: true,
          },
          {
            name: t(client, lang, "commands.bank.fields.bank"),
            value: `${currencyEmoji} ${(bank + amount).toLocaleString()}`,
            inline: true,
          },
        );

      await interaction.editReply({ embeds: [embed] });
    } else if (transactionType === "withdraw") {
      // Calculate amount to withdraw
      let amount: number;
      if (amountStr === "all" || amountStr === "max" || amountStr === "все") {
        amount = bank;
      } else {
        amount = parseInt(amountStr);
        if (isNaN(amount) || amount <= 0) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.holder.colors.error)
                .setDescription(t(client, lang, "commands.bank.messages.invalid_amount")),
            ],
          });
        }
      }

      // Check if user has enough money in bank
      if (amount > bank) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.holder.colors.error)
              .setDescription(
                t(
                  client,
                  lang,
                  "commands.bank.messages.insufficient_bank",
                  `${currencyEmoji} ${bank.toLocaleString()}`,
                ),
              ),
          ],
        });
      }

      // Check if amount is 0
      if (amount === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.holder.colors.error)
              .setDescription(t(client, lang, "commands.bank.messages.no_money_bank")),
          ],
        });
      }

      // Perform withdrawal
      await user.set("economy.balance.wallet", wallet + amount);
      await user.set("economy.balance.bank", bank - amount);

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
            "commands.bank.messages.withdraw_success",
            `${currencyEmoji} ${amount.toLocaleString()}`,
          ),
        )
        .addFields(
          {
            name: t(client, lang, "commands.bank.fields.wallet"),
            value: `${currencyEmoji} ${(wallet + amount).toLocaleString()}`,
            inline: true,
          },
          {
            name: t(client, lang, "commands.bank.fields.bank"),
            value: `${currencyEmoji} ${(bank - amount).toLocaleString()}`,
            inline: true,
          },
        );

      await interaction.editReply({ embeds: [embed] });
    }
  },
} as SlashCommand;
