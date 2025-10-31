import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, PermissionsBitField } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";

module.exports = {
  name: "games",
  description: "Setting up the search for teammates.",
  cooldown: 5,
  locale: {
    ru: "Настройка системы поиска напарников.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageChannels],
  },
  key: null,
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;
    let guild = new Guild(client, interaction.guild);
  },
} as SlashCommand;
