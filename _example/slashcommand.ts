import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, PermissionsBitField } from "discord.js";
import { Guild } from "../../helpers";

module.exports = {
  name: "",
  description: "",
  cooldown: 5,
  locale: {
    ru: "",
  },
  options: [],
  permissions: {
    bot: [],
  },
  key: null,
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;
    let guild = new Guild(client, interaction.guild);
  },
} as SlashCommand;
