import { SelectMenu } from "../../types/helpers";
import { Guild } from "../../helpers";
import {GuildMember, PermissionsBitField, UserSelectMenuInteraction} from "discord.js";

module.exports = {
    customId: "I_jtc:add_select_user",
    permissions: {
        bot: [PermissionsBitField.Flags.ManageChannels]
    },
    run: async (client, interaction: UserSelectMenuInteraction) => {
        if (!interaction.guild) return;
        if (!(interaction.member instanceof GuildMember)) return;
        if (!interaction.member.voice) return;
        if (!interaction.member.voice.channel) return;

        let guild = new Guild(client, interaction.guild);

        let channel = interaction.member.voice.channel;

        let members = interaction.values;

        for (const member of members) {
            await channel.permissionOverwrites.create(member, {
                ViewChannel: true,
                Connect: true
            });
        }

        await interaction.reply({
            content: client.holder.languages[`${guild.get("settings.language")}`].getText('functions.join_to_create.msg.add.user', members.map(m => `<@${m}>`).join(", ")),
            ephemeral: true
        })
    }
} as SelectMenu
