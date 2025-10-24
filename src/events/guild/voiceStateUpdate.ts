import { ModifiedClient } from "../../types/helpers";
import { VoiceState, ChannelType } from "discord.js";

module.exports = async (client: ModifiedClient, oldState: VoiceState, newState: VoiceState) => {

    if (!newState.guild) return;
    if (!newState.member) return;
    if (newState.member.user.bot) return;
    if (
        (!oldState.streaming && newState.streaming) ||
        (oldState.streaming && !newState.streaming) ||
        (!oldState.serverDeaf && newState.serverDeaf) ||
        (oldState.serverDeaf && !newState.serverDeaf) ||
        (!oldState.serverMute && newState.serverMute) ||
        (oldState.serverMute && !newState.serverMute) ||
        (!oldState.selfDeaf && newState.selfDeaf) ||
        (oldState.selfDeaf && !newState.selfDeaf) ||
        (!oldState.selfMute && newState.selfMute) ||
        (oldState.selfMute && !newState.selfMute) ||
        (!oldState.selfVideo && newState.selfVideo) ||
        (oldState.selfVideo && !newState.selfVideo)
    )
        if (!oldState.channelId && newState.channelId) {
            if (!newState.channel) return;
            if (!newState.guild.members.me) return;
            if (newState.channel.type == ChannelType.GuildStageVoice && newState.guild.members.me.voice.suppress) {
                try {
                    await newState.guild.members.me.voice.setSuppressed(false);
                } catch (e) {
                    console.log(String(e).grey)
                }
            }
            return
        }
    if (oldState.channelId && !newState.channelId) {
        return
    }
    if (oldState.channelId && newState.channelId) {
        if (!newState.channel) return;
        if (!newState.guild.members.me) return;
        if (newState.channel.type == ChannelType.GuildStageVoice && newState.guild.members.me.voice.suppress) {
            try {
                await newState.guild.members.me.voice.setSuppressed(false);
            } catch (e) {
                console.log(String(e).grey)
            }
        }
        return;
    }
}
