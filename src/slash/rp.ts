import { SlashCommand } from "../types/helpers";
import nekos from "nekos.life";
import { Client, EmbedBuilder, MessageFlags } from "discord.js";
import { defaultPermissions, Guild } from "../helpers";
import { t } from "../i18n/helpers";

const neko = new nekos();

type ActionType = "hug" | "kiss" | "pat" | "slap" | "poke" | "tickle";

module.exports = {
  name: "rp",
  description: "✨ Interact with others members",
  cooldown: 5,
  locale: {
    ru: "✨ Взаимодействуйте с другими участниками",
    uk: "✨ Взаємодійте з іншими учасниками",
  },
  options: [
    {
      type: "STRING_CHOICE",
      name: "action",
      description: "Select an action to perform",
      required: true,
      choices: [
        { name: "hug", value: "hug" },
        { name: "kiss", value: "kiss" },
        { name: "pat", value: "pat" },
        { name: "slap", value: "slap" },
        { name: "poke", value: "poke" },
        { name: "tickle", value: "tickle" },
      ],
      local: {
        ru: "Выберите действие для выполнения",
        uk: "Виберіть дію для виконання",
      },
    },
    {
      type: "USER",
      name: "target",
      description: "The user you want to interact with",
      required: true,
      local: {
        ru: "Пользователь, с которым вы хотите взаимодействовать",
        uk: "Користувач, з яким ви хочете взаємодіяти",
      },
    },
  ],
  permissions: {
    bot: [...defaultPermissions],
  },
  key: null,
  run: async (client: Client, interaction) => {
    if (!interaction.guild) return;
    let guild = new Guild(client, interaction.guild);

    const lang = await guild.get("settings.language");

    const action = interaction.options.getString("action") as ActionType;
    const targetUser = interaction.options.getUser("target");

    if (!targetUser) {
      return interaction.reply({
        content: t(client, lang, "commands.rp.messages.no_target"),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        content: t(client, lang, "commands.rp.messages.cannot_target_yourself"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const result = await neko[action]();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.holder.colors.default)
          .setTitle(t(client, lang, `commands.rp.embeds.${action}.title`))
          .setDescription(
            t(
              client,
              lang,
              `commands.rp.embeds.${action}.description`,
              interaction.user,
              targetUser,
            ),
          )
          .setImage(result.url),
      ],
    });
  },
} as SlashCommand;
