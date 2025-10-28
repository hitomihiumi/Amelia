import { Level, ProfileCardDisplayOptions, SlashCommand } from "../../types/helpers";
import { AttachmentBuilder, PermissionsBitField } from "discord.js";
import { Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import { ProfileCard } from "../../helpers/canvas/ProfileCard";

module.exports = {
  name: "profile",
  description: "Shows your, or someone else's, profile on the server",
  cooldown: 5,
  locale: {
    ru: "Показывает ваш, или чей-то, профиль на сервере",
  },
  options: [
    {
      name: "user",
      description: "The user whose profile you want to see",
      type: "USER",
      required: false,
      local: {
        ru: "Пользователь, чей профиль вы хотите увидеть",
      },
    },
  ],
  permissions: {
    bot: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
  },
  run: async (client, interaction) => {
    if (!interaction.guild) return;

    await interaction.deferReply();

    let guild = new Guild(client, interaction.guild);

    const user = interaction.options.getUser("user") || interaction.user;

    const member = guild.getUser(user.id);

    const levelData = (await member.get("level")) as Level;

    const displayOptions = (await member.get("custom.profile")) as ProfileCardDisplayOptions;

    const profile = new ProfileCard({
      avatar: user.displayAvatarURL({ size: 512, extension: "png" }),
      username: user.username,
      globalName: user.globalName || user.username,
      data: {
        ...levelData,
        rank: 1,
      },
      displayOptions,
    });

    const buffer = await profile.render();
    if (!buffer) {
      return interaction.editReply({
        content: t(client, await guild.get(`settings.language`), "commands.profile.error"),
      });
    }
    const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });

    return interaction.editReply({
      content: t(
        client,
        await guild.get(`settings.language`),
        "commands.profile.success",
        user.globalName,
      ),
      files: [attachment],
    });
  },
} as SlashCommand;
