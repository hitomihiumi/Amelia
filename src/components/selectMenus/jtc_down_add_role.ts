import { SelectMenu } from "../../types/helpers";
import { Guild } from "../../helpers";
import { GuildMember, RoleSelectMenuInteraction, PermissionsBitField } from "discord.js";
import { t } from "../../i18n/helpers";

module.exports = {
    customId: "I_jtc:add_select_role",
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
            await channel.permissionOverwrites.create(role, {
                ViewChannel: true,
                Connect: true
            });
        }

        await interaction.reply({
            content: t(client, await guild.get("settings.language"), 'functions.join_to_create.msg.add.role', roles.map(r => `<@&${r}>`).join(", ")),
            ephemeral: true
        })
    }
} as SelectMenu
