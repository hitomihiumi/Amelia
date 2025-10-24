import { JTCPreset } from "../types/helpers";
import {
    Client,
    BaseGuildVoiceChannel,
    ChannelType,
    PermissionFlagsBits,
    VoiceState,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    MessageActionRowComponentBuilder,
} from "discord.js";
import { Guild } from "../helpers";
import { User } from "../helpers";
import { t } from "../i18n/helpers";

module.exports = async (client: Client) => {
    client.on("voiceStateUpdate", async (oldState, newState) => {
        if (!newState.guild) return;
        let guild = new Guild(client, newState.guild);
        let map = guild.get("temp.join_to_create.map");
        let oldID = oldState.channelId || 'undefined';
        let newID = newState.channelId || 'undefined';
        if (newID === guild.get("utils.join_to_create.channel")) {
            if (oldID) {
                if (!newState.member) return;
                if (map.has(oldID) && map.get(oldID).owner === newState.member.id) {
                    await newState.member.voice.setChannel(map.get(oldID).channel);
                    return;
                } else await createChannel(client, guild, newState);
            } else await createChannel(client, guild, newState);
        }
        else if (oldID !== newID) {
            if (!oldID) return;
            if (!oldState.member) return;
            if (map.has(oldID)) deleteChannel(guild, oldID);
        }
    });
};

function deleteChannel(guild: Guild, channelId: string) {
    let map = guild.get("temp.join_to_create.map");
    let channel = guild.guild.channels.cache.get(map.get(channelId).channel) as BaseGuildVoiceChannel;
    if (!channel) return;
    if (channel.members.size === 0) {
        channel.delete();
        map.delete(channelId);
        guild.set("temp.join_to_create.map", map);
    }
}

async function createChannel(client: Client, guild: Guild, newState: VoiceState) {
    if (!newState.member) return;
    const lang = guild.get("settings.language");
    let map = guild.get("temp.join_to_create.map");
    let channel = await newState.guild.channels.create({
        name: client.holder.utils.reVar(guild.get("utils.join_to_create.default_name"), newState.member.displayName),
        type: ChannelType.GuildVoice,
        parent: guild.get("utils.join_to_create.category"),
        permissionOverwrites: [
            {
                id: newState.member.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect]
            }
        ]
    })

    await newState.member.voice.setChannel(channel);

    const user = new User(client, newState.member.user, guild.guild);

    const presets = user.get("presets.jtc") as JTCPreset[];

    const select = new StringSelectMenuBuilder()
        .setCustomId("I_jtc:preset")
        .setPlaceholder(t(client, lang, "functions.join_to_create.preset.placeholder"))
        .setMaxValues(1)

    if (presets.length > 0) {
        for (const preset of presets) {
            select.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(preset.name)
                    .setValue(preset.id)
                    .setDescription(preset.description || t(client, lang, "functions.join_to_create.preset.default_description"))
            )
        }
    } else {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(t(client, lang, "functions.join_to_create.preset.add"))
                .setValue("new")
                .setDescription(t(client, lang, "functions.join_to_create.preset.add_description"))
        )
    }

    channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor(client.holder.colors.default)
                .setTitle(t(client, lang, "functions.join_to_create.embed.title"))
                .setDescription(t(client, lang, "functions.join_to_create.embed.description"))
        ],
        components: [
            new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .setComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("I_jtc:up_select")
                        .setPlaceholder(t(client, lang, "functions.join_to_create.up_select.placeholder"))
                        .setMaxValues(1)
                        .setOptions(
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738398347407540")
                                .setValue("rename")
                                .setLabel(t(client, lang, "functions.join_to_create.up_select.options.rename.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.up_select.options.rename.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738390948663306")
                                .setValue("bitrate")
                                .setLabel(t(client, lang, "functions.join_to_create.up_select.options.bitrate.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.up_select.options.bitrate.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738394513801327")
                                .setValue("limit")
                                .setLabel(t(client, lang, "functions.join_to_create.up_select.options.limit.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.up_select.options.limit.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738393591066724")
                                .setValue("owner")
                                .setLabel(t(client, lang, "functions.join_to_create.up_select.options.owner.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.up_select.options.owner.description"))
                        )
                ),
            new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .setComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("I_jtc:down_select")
                        .setPlaceholder(t(client, lang, "functions.join_to_create.down_select.placeholder"))
                        .setMaxValues(1)
                        .setOptions(
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738399828000879")
                                .setValue("open")
                                .setLabel(t(client, lang, "functions.join_to_create.down_select.options.open.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.down_select.options.open.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738396061503548")
                                .setValue("close")
                                .setLabel(t(client, lang, "functions.join_to_create.down_select.options.close.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.down_select.options.close.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738402130677910")
                                .setValue("add")
                                .setLabel(t(client, lang, "functions.join_to_create.down_select.options.add.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.down_select.options.add.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194738403409932328")
                                .setValue("remove")
                                .setLabel(t(client, lang, "functions.join_to_create.down_select.options.remove.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.down_select.options.remove.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194761795760554074")
                                .setValue("show")
                                .setLabel(t(client, lang, "functions.join_to_create.down_select.options.show.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.down_select.options.show.description")),
                            new StringSelectMenuOptionBuilder()
                                .setEmoji("1194761783043440720")
                                .setValue("hide")
                                .setLabel(t(client, lang, "functions.join_to_create.down_select.options.hide.label"))
                                .setDescription(t(client, lang, "functions.join_to_create.down_select.options.hide.description"))
                        )
                ),
            new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .setComponents(
                    select
                )
        ]
    })

    map.set(newState.channelId, {
        channel: channel.id,
        owner: newState.member.id
    });

    guild.set("temp.join_to_create.map", map);
}
