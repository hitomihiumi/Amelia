import { SelectMenu } from "../../types/helpers";
import { Guild } from "../../helpers";
import {GuildMember, PermissionsBitField, RoleSelectMenuInteraction} from "discord.js";
import { t } from "../../i18n/helpers";

module.exports = {
    customId: "I_jtc:remove_select_role",
    permissions: {
        bot: [PermissionsBitField.Flags.ManageChannels]
    },
    run: async (client, interaction: RoleSelectMenuInteraction) => {
        if (!interaction.guild) return;
        if (!(interaction.member instanceof GuildMember)) return;
        if (!interaction.member.voice) return;
        if (!interaction.member.voice.channel) return;

        let guild = new Guild(client, interaction.guild);

        let channel = interaction.member.voice.channel;

        let roles = interaction.values;

        for (const role of roles) {
            await channel.permissionOverwrites.delete(role);
        }

        await interaction.reply({
            content: t(client, guild.get("settings.language"), 'functions.join_to_create.msg.remove.role', roles.map(r => `<@&${r}>`).join(", ")),
            ephemeral: true
        })
    }
} as SelectMenu
