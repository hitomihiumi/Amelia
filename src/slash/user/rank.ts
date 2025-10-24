import { Level, RankCardDisplayOptions, SlashCommand } from "../../types/helpers";
import { AttachmentBuilder, PermissionsBitField } from "discord.js";
import { Guild } from "../../helpers";
import { RankCard } from "../../helpers/canvas/RankCard";

module.exports = {
  name: "rank",
  description: "Shows your, or someone else's, level on the server",
  cooldown: 5,
  locale: {
    ru: "Показывает ваш, или чей-то, уровень на сервере",
  },
  options: [
    {
      name: "user",
      description: "The user whose rank you want to see",
      type: "USER",
      required: false,
      local: {
        ru: "Пользователь, чей ранг вы хотите увидеть",
      },
    },
  ],
  permissions: {
    bot: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
  },
  run: async (client, interaction) => {
    if (!interaction.guild) return;
    let guild = new Guild(client, interaction.guild);

    const user = interaction.options.getUser("user") || interaction.user;

    const member = guild.getUser(user.id);

    const levelData = (await member.get("level")) as Level;

    const displayOptions = (await member.get("custom.rank")) as RankCardDisplayOptions;

    const rank = new RankCard({
      avatar: user.displayAvatarURL({ size: 512, extension: "png" }),
      username: user.username,
      data: {
        ...levelData,
        rank: 1,
      },
      displayOptions,
    });

    await interaction.deferReply();

    const buffer = await rank.render();
    if (!buffer) {
      return interaction.reply({
        content: "An error occurred while generating the rank card.",
        ephemeral: true,
      });
    }
    const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });

    return interaction.editReply({
      content: `${user.username}'s rank card:`,
      files: [attachment],
    });
  },
} as SlashCommand;
