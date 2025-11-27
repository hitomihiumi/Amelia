import { Levels, SlashCommand } from "../../types/helpers";
import { Client, CommandInteraction, PermissionsBitField } from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";

module.exports = {
  name: "levels",
  description: "Setting up the leveling system on the server.",
  cooldown: 5,
  locale: {
    ru: "Настройка системы уровней на сервере.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageRoles],
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;
    let guild = new Guild(client, interaction.guild);

    const lang = await guild.get("settings.language");

    const levelSettings = await mostUsedQueries.getLevelSettings(guild);
  },
} as SlashCommand;

const mostUsedQueries = {
  getLevelSettings: async (guild: Guild) => {
    return (await guild.get("utils.levels")) as Levels;
  },
  setRoles: async (guild: Guild, roles: Levels["level_roles"]) => {
    return await guild.set("utils.levels.level_roles", roles);
  },
  setEnabled: async (guild: Guild, val: boolean) => {
    return await guild.set("utils.levels.enabled", val);
  },
};
