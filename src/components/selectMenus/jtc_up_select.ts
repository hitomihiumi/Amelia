import { SelectMenu } from "../../types/helpers";
import { Guild } from "../../helpers";
import {
  GuildMember,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  ModalActionRowComponentBuilder,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { t } from "../../i18n/helpers";

module.exports = {
  customId: "I_jtc:up_select",
  permissions: {
    bot: [PermissionsBitField.Flags.ManageChannels],
  },
  run: async (client, interaction: StringSelectMenuInteraction) => {
    if (!interaction.guild) return;
    if (!(interaction.member instanceof GuildMember)) return;
    if (!interaction.member.voice) return;
    if (!interaction.member.voice.channel) return;
    let guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    let map = await guild.get("temp.join_to_create.map");

    if (
      map.has(interaction.member.voice.channelId) &&
      map.get(interaction.member.voice.channelId).owner === interaction.user.id
    ) {
      let modal = new ModalBuilder();
      let result;
      let channel = interaction.member.voice.channel;
      switch (interaction.values[0]) {
        case "rename":
          modal
            .setCustomId("NI_jtc:rename_channel")
            .setTitle(t(client, lang, "functions.join_to_create.modals.rename.title"))
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_jtc:rename_channel")
                  .setMaxLength(56)
                  .setRequired(true)
                  .setLabel(t(client, lang, "functions.join_to_create.modals.rename.label"))
                  .setStyle(TextInputStyle.Short),
              ),
            );

          await interaction.showModal(modal);

          const submit = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (i: any) =>
              i.user.id === interaction.user.id && i.customId === "NI_jtc:rename_channel",
          });

          if (submit) {
            result = submit.fields.getTextInputValue("NI_jtc:rename_channel");

            await channel.setName(result);

            await submit.reply({
              content: t(client, lang, "functions.join_to_create.modals.rename.success", result),
              ephemeral: true,
            });
          }
          break;
        case "bitrate":
          modal
            .setCustomId("NI_jtc:bitrate_channel")
            .setTitle(t(client, lang, "functions.join_to_create.modals.bitrate.title"))
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_jtc:bitrate_channel")
                  .setMaxLength(3)
                  .setRequired(true)
                  .setLabel(t(client, lang, "functions.join_to_create.modals.bitrate.label"))
                  .setPlaceholder(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.modals.bitrate.placeholder",
                      interaction.guild.maximumBitrate / 1000,
                    ),
                  )
                  .setStyle(TextInputStyle.Short),
              ),
            );

          await interaction.showModal(modal);

          const bitrate = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (i: any) =>
              i.user.id === interaction.user.id && i.customId === "NI_jtc:bitrate_channel",
          });

          if (bitrate) {
            result = bitrate.fields.getTextInputValue("NI_jtc:bitrate_channel");

            if (isNaN(parseInt(result)))
              return bitrate.reply({
                content: t(
                  client,
                  lang,
                  "functions.join_to_create.modals.bitrate.isnan",
                  interaction.guild.maximumBitrate / 1000,
                ),
                ephemeral: true,
              });

            if (parseInt(result) < 8)
              return bitrate.reply({
                content: t(client, lang, "functions.join_to_create.modals.bitrate.less"),
                ephemeral: true,
              });

            let channel = interaction.member.voice.channel;

            await channel.setBitrate(
              parseInt(result) * 1000 > interaction.guild.maximumBitrate
                ? interaction.guild.maximumBitrate
                : parseInt(result) * 1000,
            );

            await bitrate.reply({
              content: t(client, lang, "functions.join_to_create.modals.bitrate.success", result),
              ephemeral: true,
            });
          }
          break;
        case "limit":
          modal
            .setCustomId("NI_jtc:limit_channel")
            .setTitle(t(client, lang, "functions.join_to_create.modals.limit.title"))
            .setComponents(
              new ActionRowBuilder<ModalActionRowComponentBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId("NI_jtc:limit_channel")
                  .setMaxLength(2)
                  .setRequired(true)
                  .setLabel(t(client, lang, "functions.join_to_create.modals.limit.label"))
                  .setPlaceholder(
                    t(client, lang, "functions.join_to_create.modals.limit.placeholder"),
                  )
                  .setStyle(TextInputStyle.Short),
              ),
            );

          await interaction.showModal(modal);

          const limit = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (i: any) =>
              i.user.id === interaction.user.id && i.customId === "NI_jtc:limit_channel",
          });

          if (limit) {
            result = limit.fields.getTextInputValue("NI_jtc:limit_channel");

            if (isNaN(parseInt(result)))
              return limit.reply({
                content: t(client, lang, "functions.join_to_create.modals.limit.isnan"),
                ephemeral: true,
              });

            if (parseInt(result) < 0)
              return limit.reply({
                content: t(client, lang, "functions.join_to_create.modals.limit.less"),
                ephemeral: true,
              });

            await channel.setUserLimit(parseInt(result));

            await limit.reply({
              content: t(client, lang, "functions.join_to_create.modals.limit.success", result),
              ephemeral: true,
            });
          }
          break;
        case "owner":
          await interaction.reply({
            content: t(client, lang, "functions.join_to_create.select_menus.owner.msg"),
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new UserSelectMenuBuilder()
                  .setCustomId("I_jtc:owner_select")
                  .setPlaceholder(
                    t(client, lang, "functions.join_to_create.select_menus.owner.placeholder"),
                  )
                  .setMaxValues(1),
              ),
            ],
            ephemeral: true,
          });
          break;
      }
    } else {
      await interaction.reply({
        content: t(client, lang, "functions.join_to_create.errors.not_owner"),
        ephemeral: true,
      });
    }
  },
} as SelectMenu;
