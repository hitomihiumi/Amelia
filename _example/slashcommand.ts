import { ModifiedClient, SlashCommand } from "../../types/helpers";
import { CommandInteraction, PermissionsBitField } from "discord.js";
import { Guild } from "../../helpers";

module.exports = {
    name: "",
    description: "",
    cooldown: 5,
    locale: {
        "ru": "",
    },
    options: [],
    permissions: {
        bot: []
    },
    key: null,
    run: async (client: ModifiedClient, interaction: CommandInteraction) => {
        if (!interaction.guild) return;
        let guild = new Guild(client, interaction.guild);
    }
} as SlashCommand;
