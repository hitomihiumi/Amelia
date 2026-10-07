import { SlashCommand } from "../../types/helpers";
import {
  ChatInputCommandInteraction,
  Client,
  MessageFlagsBitField,
  PermissionFlagsBits,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import { forget } from "../../helpers/ai";

module.exports = {
  name: "reset",
  description: "🧹 Make Amelia forget the recent conversation in this channel.",
  cooldown: 5,
  locale: {
    ru: "🧹 Заставить Амелию забыть недавний разговор в этом канале.",
    uk: "🧹 Змусити Амелію забути нещодавню розмову в цьому каналі.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild || !interaction.channel) return;

    const guild = new Guild(client, interaction.guild);
    const lang = (await guild.get("settings.language")) as string;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: t(client, lang, "ai.reset.no_permission"),
        flags: MessageFlagsBitField.Flags.Ephemeral,
      });
    }

    await forget(interaction.channel.id);

    await interaction.reply({
      content: t(client, lang, "ai.reset.success"),
      flags: MessageFlagsBitField.Flags.Ephemeral,
    });
  },
} as SlashCommand;
