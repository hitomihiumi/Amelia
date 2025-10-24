import { ModifiedClient, SlashCommand } from "../../types/helpers";
import { CommandInteraction, PermissionsBitField } from "discord.js";
import { Guild } from "../../helpers";

module.exports = {
    name: "games",
    description: "Setting up the search for teammates.",
    cooldown: 5,
    locale: {
        "ru": "Настройка системы поиска напарников.",
    },
    options: [],
    permissions: {
        bot: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.EmbedLinks]
    },
    key: null,
    run: async (client: ModifiedClient, interaction: CommandInteraction) => {
        if (!interaction.guild) return;
        let guild = new Guild(client, interaction.guild);


    }
} as SlashCommand;
