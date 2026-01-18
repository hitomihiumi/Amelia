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

    try {
      const guild = new Guild(client, newState.guild);
      let map =
        (await guild.cache.get("temp.join_to_create.map")) ||
        new Map<string, { channel: string; owner: string }>();

      await cleanupStaleChannels(guild, map);

      const oldID = oldState.channelId || undefined;
      const newID = newState.channelId || undefined;
      const jtcChannelId = await guild.get("utils.join_to_create.channel");

      if (newID === jtcChannelId) {
        if (!newState.member) return;

        if (oldID && map.has(oldID)) {
          const channelData = map.get(oldID);
          if (channelData?.owner === newState.member.id) {
            const existingChannel = newState.guild.channels.cache.get(channelData.channel);
            if (existingChannel) {
              await newState.member.voice.setChannel(channelData.channel);
              return;
            } else {
              map.delete(oldID);
              await guild.cache.set("temp.join_to_create.map", map);
            }
          }
        }

        await createChannel(client, guild, newState, map);
      } else if (oldID && oldID !== newID) {
        if (!oldState.member) return;

        if (map.has(oldID)) {
          await deleteChannel(guild, oldID, map);
        }
      }
    } catch (error) {
      console.error("[JTC] Error in voiceStateUpdate:", error);
    }
  });
};

async function cleanupStaleChannels(
  guild: Guild,
  map: Map<string, { channel: string; owner: string }>,
) {
  const channelsToRemove: string[] = [];

  for (const [triggerChannelId, data] of map.entries()) {
    const channel = guild.guild.channels.cache.get(data.channel);

    if (!channel) {
      channelsToRemove.push(triggerChannelId);
      continue;
    }

    if (channel.type !== ChannelType.GuildVoice) {
      channelsToRemove.push(triggerChannelId);
      continue;
    }

    const voiceChannel = channel as BaseGuildVoiceChannel;
    if (voiceChannel.members.size === 0) {
      try {
        await voiceChannel.delete("Empty temporary voice channel cleanup");
        channelsToRemove.push(triggerChannelId);
      } catch (error) {
        console.error(`[JTC] Failed to delete empty channel ${data.channel}:`, error);
        if (!guild.guild.channels.cache.get(data.channel)) {
          channelsToRemove.push(triggerChannelId);
        }
      }
    }
  }

  if (channelsToRemove.length > 0) {
    for (const channelId of channelsToRemove) {
      map.delete(channelId);
    }
    await guild.cache.set("temp.join_to_create.map", map);
  }
}

async function deleteChannel(
  guild: Guild,
  triggerChannelId: string,
  map: Map<string, { channel: string; owner: string }>,
) {
  const channelData = map.get(triggerChannelId);
  if (!channelData) return;

  const channel = guild.guild.channels.cache.get(channelData.channel) as BaseGuildVoiceChannel;

  if (!channel) {
    map.delete(triggerChannelId);
    await guild.cache.set("temp.join_to_create.map", map);
    return;
  }

  if (channel.members.size === 0) {
    try {
      await channel.delete("Temporary voice channel owner left");
      map.delete(triggerChannelId);
      await guild.cache.set("temp.join_to_create.map", map);
    } catch (error) {
      console.error(`[JTC] Failed to delete channel ${channelData.channel}:`, error);

      const channelStillExists = guild.guild.channels.cache.get(channelData.channel);
      if (!channelStillExists) {
        map.delete(triggerChannelId);
        await guild.cache.set("temp.join_to_create.map", map);
      }
    }
  }
}

async function createChannel(
  client: Client,
  guild: Guild,
  newState: VoiceState,
  map: Map<string, { channel: string; owner: string }>,
) {
  if (!newState.member) return;
  if (!newState.channelId) return;

  const lang = await guild.get("settings.language");

  try {
    await newState.guild.channels.fetch();

    const channel = await newState.guild.channels.create({
      name: client.holder.utils.reVar(
        await guild.get("utils.join_to_create.default_name"),
        newState.member.displayName,
      ),
      type: ChannelType.GuildVoice,
      parent: await guild.get("utils.join_to_create.category"),
      permissionOverwrites: [
        {
          id: newState.guild.id,
          deny: [],
        },
        {
          id: newState.member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
          ],
        },
      ],
    });

    try {
      await newState.member.voice.setChannel(channel);
    } catch (error) {
      console.error("[JTC] Failed to move user to new channel:", error);
      try {
        await channel.delete("Failed to move user to channel");
      } catch (deleteError) {
        console.error("[JTC] Failed to delete unused channel:", deleteError);
      }
      return;
    }

    const user = new User(client, newState.member.user, guild.guild);
    const presets = (await user.get("presets.jtc")) as JTCPreset[];

    const select = new StringSelectMenuBuilder()
      .setCustomId("I_jtc:preset")
      .setPlaceholder(t(client, lang, "functions.join_to_create.preset.placeholder"))
      .setMaxValues(1);

    if (presets.length > 0) {
      for (const preset of presets) {
        select.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(preset.name)
            .setValue(preset.id)
            .setDescription(
              preset.description ||
                t(client, lang, "functions.join_to_create.preset.default_description"),
            ),
        );
      }
    } else {
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(t(client, lang, "functions.join_to_create.preset.add"))
          .setValue("new")
          .setDescription(t(client, lang, "functions.join_to_create.preset.add_description")),
      );
    }

    try {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.holder.colors.default)
            .setTitle(t(client, lang, "functions.join_to_create.embed.title"))
            .setDescription(t(client, lang, "functions.join_to_create.embed.description")),
        ],
        components: [
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new StringSelectMenuBuilder()
              .setCustomId("I_jtc:up_select")
              .setPlaceholder(t(client, lang, "functions.join_to_create.up_select.placeholder"))
              .setMaxValues(1)
              .setOptions(
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738398347407540")
                  .setValue("rename")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.up_select.options.rename.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.up_select.options.rename.description",
                    ),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738390948663306")
                  .setValue("bitrate")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.up_select.options.bitrate.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.up_select.options.bitrate.description",
                    ),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738394513801327")
                  .setValue("limit")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.up_select.options.limit.label"),
                  )
                  .setDescription(
                    t(client, lang, "functions.join_to_create.up_select.options.limit.description"),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738393591066724")
                  .setValue("owner")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.up_select.options.owner.label"),
                  )
                  .setDescription(
                    t(client, lang, "functions.join_to_create.up_select.options.owner.description"),
                  ),
              ),
          ),
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new StringSelectMenuBuilder()
              .setCustomId("I_jtc:down_select")
              .setPlaceholder(t(client, lang, "functions.join_to_create.down_select.placeholder"))
              .setMaxValues(1)
              .setOptions(
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738399828000879")
                  .setValue("open")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.down_select.options.open.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.down_select.options.open.description",
                    ),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738396061503548")
                  .setValue("close")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.down_select.options.close.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.down_select.options.close.description",
                    ),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738402130677910")
                  .setValue("add")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.down_select.options.add.label"),
                  )
                  .setDescription(
                    t(client, lang, "functions.join_to_create.down_select.options.add.description"),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194738403409932328")
                  .setValue("remove")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.down_select.options.remove.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.down_select.options.remove.description",
                    ),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194761795760554074")
                  .setValue("show")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.down_select.options.show.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.down_select.options.show.description",
                    ),
                  ),
                new StringSelectMenuOptionBuilder()
                  .setEmoji("1194761783043440720")
                  .setValue("hide")
                  .setLabel(
                    t(client, lang, "functions.join_to_create.down_select.options.hide.label"),
                  )
                  .setDescription(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.down_select.options.hide.description",
                    ),
                  ),
              ),
          ),
          new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(select),
        ],
      });
    } catch (error) {
      console.error("[JTC] Failed to send control message to channel:", error);
    }

    map.set(newState.channelId, {
      channel: channel.id,
      owner: newState.member.id,
    });

    await guild.cache.set("temp.join_to_create.map", map);
  } catch (error) {
    console.error("[JTC] Failed to create temporary voice channel:", error);
  }
}
