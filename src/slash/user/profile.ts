import { Level, ProfileCardDisplayOptions, SlashCommand } from "../../types/helpers";
import { AttachmentBuilder, PermissionsBitField } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import {t, tObject} from "../../i18n/helpers";
import { ProfileCard } from "../../helpers/canvas/ProfileCard";

module.exports = {
  name: "profile",
  description: "🖼️ Shows your, or someone else's, profile on the server",
  cooldown: 5,
  locale: {
    ru: "🖼️ Показывает ваш, или чей-то, профиль на сервере",
    uk: "🖼️ Показує ваш, або чиїсь, профіль на сервері",
  },
  options: [
    {
      name: "user",
      description: "The user whose profile you want to see",
      type: "USER",
      required: false,
      local: {
        ru: "Пользователь, чей профиль вы хотите увидеть",
        uk: "Користувач, чиїй профіль ви хочете побачити",
      },
    },
  ],
  permissions: {
    bot: [...defaultPermissions],
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
      avatar: user.displayAvatarURL({ size: 512, extension: "jpg" }),
      username: user.username,
      globalName: user.globalName || user.username,
      data: {
        ...levelData,
        rank: 1,
      },
      displayOptions,
    }, tObject(client, await guild.get(`settings.language`), "time_units"));

    const buffer = await profile.render();
    if (!buffer) {
      return interaction
        .editReply({
          content: t(client, await guild.get(`settings.language`), "commands.profile.error"),
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch(() => {});
          }, 5000);
        });
    }
    const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });

    return interaction.editReply({
      files: [attachment],
    });
  },
} as SlashCommand;
