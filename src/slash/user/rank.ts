import { Level, RankCardDisplayOptions, SlashCommand } from "../../types/helpers";
import { AttachmentBuilder, MessageFlags, PermissionsBitField } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { RankCard } from "../../helpers/canvas/RankCard";
import {t, tObject} from "../../i18n/helpers";

module.exports = {
  name: "rank",
  description: "🎗️ Shows your, or someone else's, level on the server",
  cooldown: 5,
  locale: {
    ru: "🎗️ Показывает ваш, или чей-то, уровень на сервере",
    uk: "🎗️ Показує ваш, або чиїйсь, рівень на сервері",
  },
  options: [
    {
      name: "user",
      description: "The user whose rank you want to see",
      type: "USER",
      required: false,
      local: {
        ru: "Пользователь, чей ранг вы хотите увидеть",
        uk: "Користувач, чиїй ранг ви хочете побачити",
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

    const displayOptions = (await member.get("custom.rank")) as RankCardDisplayOptions;

    const rank = new RankCard({
      avatar: user.displayAvatarURL({ size: 512, extension: "jpg" }),
      username: user.username,
      globalName: user.globalName || user.username,
      data: {
        ...levelData,
        rank: 1,
      },
      displayOptions,
    }, tObject(client, await guild.get(`settings.language`), "time_units"));

    const buffer = await rank.render();
    if (!buffer) {
      return interaction
        .editReply({
          content: t(client, await guild.get(`settings.language`), "commands.rank.error"),
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch(() => {});
          }, 5000);
        });
    }
    const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });

    return interaction.editReply({
      files: [attachment],
    });
  },
} as SlashCommand;
