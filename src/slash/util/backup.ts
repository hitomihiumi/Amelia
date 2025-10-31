import { SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, PermissionsBitField } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";

module.exports = {
  name: "backup",
  description: "Backup and restore guild channels and roles.",
  cooldown: 5,
  locale: {
    ru: "Резервное копирование и восстановление каналов и ролей гильдии.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  key: null,
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;
    let guild = new Guild(client, interaction.guild);
  },
} as SlashCommand;
