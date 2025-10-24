import { SelectMenu } from "../../types/helpers";
import { Guild } from "../../helpers";
import {GuildMember, PermissionsBitField, UserSelectMenuInteraction} from "discord.js";
import { t } from "../../i18n/helpers";

module.exports = {
    customId: "I_jtc:owner_select",
    permissions: {
        bot: [PermissionsBitField.Flags.ManageChannels]
    },
    run: async (client, interaction: UserSelectMenuInteraction) => {
        if (!interaction.guild) return;
        if (!(interaction.member instanceof GuildMember)) return;
        if (!interaction.member.voice) return;
        if (!interaction.member.voice.channel) return;
        let guild = new Guild(client, interaction.guild);
        const lang = await guild.get("settings.language");

        let member = interaction.values[0];

        let channel = interaction.member.voice.channel;

        if (member === interaction.user.id) return interaction.reply({
            content: t(client, lang, 'functions.join_to_create.errors.yourself'),
            ephemeral: true
        });

        let map = await guild.get("temp.join_to_create.map");

        await channel.permissionOverwrites.delete(interaction.user.id);

        await channel.permissionOverwrites.create(member, {
            ViewChannel: true,
            ManageChannels: true,
            Connect: true
        });

        map.set(channel.id, {
            channel: channel.id,
            owner: member
        });

        guild.set("temp.join_to_create.map", map);

        await interaction.reply({
            content: t(client, lang, 'functions.join_to_create.msg.owner', `<@${member}>`),
            ephemeral: true
        })
    }
} as SelectMenu;
