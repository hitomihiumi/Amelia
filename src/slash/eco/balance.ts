import { SlashCommand } from "../../types/helpers";
import { AttachmentBuilder, ChatInputCommandInteraction, Client } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { BalanceCard } from "../../helpers/canvas/BalanceCard";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "balance",
  description: "Shows your, or someone else's, balance",
  cooldown: 5,
  locale: {
    ru: "Отображает информацию о балансе",
  },
  options: [
    {
      name: "user",
      description: "The user whose balance you want to see",
      type: "USER",
      required: false,
      local: {
        ru: "Пользователь, чей баланс вы хотите увидеть",
      },
    },
  ],
  permissions: {
    bot: [...defaultPermissions],
  },
  key: null,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply();

    let guild = new Guild(client, interaction.guild);

    const user = interaction.options.getUser("user") || interaction.user;

    const member = guild.getUser(user.id);

    const data = await member.get("economy.balance");

    const displayOptions = await member.get("custom.balance");

    const balance = new BalanceCard({
      username: user.globalName || user.username,
      data: {
        ...data,
      },
      displayOptions,
      emojiURL: `https://cdn.discordapp.com/emojis/${(await guild.get("economy.currency.id")) || client.holder.emojis.ids.gems}.png?size=44`,
    });

    const buffer = await balance.render();
    if (!buffer) {
      return interaction
        .editReply({
          content: t(client, await guild.get(`settings.language`), "commands.balance.error"),
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch(() => {});
          }, 5000);
        });
    }
    const attachment = new AttachmentBuilder(buffer, { name: "balance.jpg" });

    return interaction.editReply({
      files: [attachment],
    });
  },
} as SlashCommand;
