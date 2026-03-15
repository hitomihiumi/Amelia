import { SlashCommand } from "../../types/helpers";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  PermissionsBitField,
  MessageFlagsBitField,
  LabelBuilder,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "jtc",
  description: "📞 Setting Join To Create",
  locale: {
    ru: "📞 Настройка функционала Join To Create",
    uk: "📞 Налаштування функціоналу Join To Create",
  },
  cooldown: 5,
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageChannels],
  },
  options: [],
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    let guild = new Guild(client, interaction.guild);

    const lang = await guild.get("settings.language");

    let settings = await mostUsedQueries.getJCSettings(guild);

    let row = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_jtc:toggle")
        .setLabel(
          `${settings.enabled ? t(client, lang, "commands.jtc.buttons.disable") : t(client, lang, "commands.jtc.buttons.enable")}`,
        )
        .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("NI_jtc:change")
        .setLabel(`${t(client, lang, "commands.jtc.buttons.change_name")}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!settings.enabled),
      new ButtonBuilder()
        .setCustomId("NI_jtc:setup")
        .setLabel(`${t(client, lang, "commands.jtc.buttons.setup")}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!settings.enabled),
    );

    let channel_row = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      client.holder.utils.fastChannelSelect({
        custom_id: "NI_jtc:set_jtc_channel",
        channel_types: [ChannelType.GuildVoice],
        type: 8,
        placeholder: t(client, lang, "commands.jtc.select_menus.channel.placeholder"),
        disabled: !settings.enabled,
      }),
    );

    let embed = new EmbedBuilder()
      .setTitle(`${t(client, lang, "commands.jtc.embeds.title")}`)
      .setColor(client.holder.colors.default)
      .setDescription(`${t(client, lang, "commands.jtc.embeds.description")}`);

    embed = updateFields(embed, client, lang, settings, interaction);

    let msg = await interaction.editReply({ embeds: [embed], components: [channel_row, row] });

    const filter = (i: any) => i.user.id === interaction.user.id;

    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      if (i.isButton()) {
        if (i.customId === "NI_jtc:toggle") {
          await mostUsedQueries.setEnabled(guild, !settings.enabled);

          settings.enabled = !settings.enabled;
          row.components[0] = new ButtonBuilder()
            .setCustomId("NI_jtc:toggle")
            .setLabel(
              `${settings.enabled ? t(client, lang, "commands.jtc.buttons.disable") : t(client, lang, "commands.jtc.buttons.enable")}`,
            )
            .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success);
          row.components[1].data.disabled = !row.components[1].data.disabled;
          row.components[2].data.disabled = !row.components[2].data.disabled;

          embed = updateFields(embed, client, lang, settings, interaction);

          await i.update({ embeds: [embed], components: [channel_row, row] });
        } else if (i.customId === "NI_jtc:setup") {
          let category = await guild.guild.channels.create({
            name: `Join To Create`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
              {
                id: guild.guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
              },
            ],
          });

          let channel = await guild.guild.channels.create({
            name: `Join To Create`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.guild.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
              },
            ],
          });

          await mostUsedQueries.setCategory(guild, category.id);
          await mostUsedQueries.setChannel(guild, channel.id);

          settings.category = category.id;
          settings.channel = channel.id;

          embed = updateFields(embed, client, lang, settings, interaction);

          await i.update({ embeds: [embed], components: [channel_row, row] });
        } else if (i.customId === "NI_jtc:change") {
          let modal = new ModalBuilder()
            .setTitle(`${t(client, lang, "commands.jtc.modals.change_name.title")}`)
            .setCustomId("NI_jtc:change_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.jtc.modals.change_name.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(7)
                    .setMaxLength(56)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_jtc:change_name")
                    .setPlaceholder(
                      `${t(client, lang, "commands.jtc.modals.change_name.placeholder")}`,
                    ),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (i: any) =>
                i.user.id === interaction.user.id && i.customId === "NI_jtc:change_modal",
            })
            .then(async (int) => {
              await int.deferUpdate();

              let name = int.fields.getTextInputValue("NI_jtc:change_name");

              await mostUsedQueries.setDefaultName(guild, name);

              embed = updateFields(embed, client, lang, settings, interaction);

              await int.editReply({ embeds: [embed], components: [channel_row, row] });
            });
        }
      } else if (i.isChannelSelectMenu()) {
        if (i.customId === "NI_jtc:set_jtc_channel") {
          let channelId = i.values[0];

          let channel = guild.guild.channels.cache.get(channelId);
          if (!channel || channel.type !== ChannelType.GuildVoice || !channel.parentId) {
            return await i.reply({
              content: t(client, lang, "commands.jtc.messages.channel.error"),
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
          }

          await mostUsedQueries.setChannel(guild, channelId);
          await mostUsedQueries.setCategory(guild, channel.parentId);
          settings.channel = channelId;
          settings.category = channel.parentId;

          embed = updateFields(embed, client, lang, settings, interaction);

          await i.update({ embeds: [embed], components: [channel_row, row] });
        }
      }
    });
  },
} as SlashCommand;

function updateFields(
  embed: EmbedBuilder,
  client: Client,
  lang: string,
  settings: any,
  interaction: CommandInteraction,
) {
  delete embed.data.fields;
  return embed.addFields(
    {
      name: `${t(client, lang, "commands.jtc.embeds.fields.status.status")}`,
      value: `${settings.enabled ? t(client, lang, "commands.jtc.embeds.fields.status.enabled") : t(client, lang, "commands.jtc.embeds.fields.status.disabled")}`,
      inline: true,
    },
    {
      name: `${t(client, lang, "commands.jtc.embeds.fields.category")}`,
      value: `<#${settings.category}>`,
      inline: true,
    },
    {
      name: `${t(client, lang, "commands.jtc.embeds.fields.channel")}`,
      value: `<#${settings.channel}>`,
      inline: true,
    },
    {
      name: `${t(client, lang, "commands.jtc.embeds.fields.default_name")}`,
      value: `${client.holder.utils.reVar(settings.default_name, interaction.user.displayName)}`,
      inline: true,
    },
  );
}

const mostUsedQueries = {
  getJCSettings: async (guild: Guild) => {
    return await guild.get("utils.join_to_create");
  },
  setDefaultName: async (guild: Guild, name: string) => {
    return await guild.set("utils.join_to_create.default_name", name);
  },
  setChannel: async (guild: Guild, channel: string) => {
    return await guild.set("utils.join_to_create.channel", channel);
  },
  setCategory: async (guild: Guild, category: string) => {
    return await guild.set("utils.join_to_create.category", category);
  },
  setEnabled: async (guild: Guild, val: boolean) => {
    return await guild.set("utils.join_to_create.enabled", val);
  },
};
