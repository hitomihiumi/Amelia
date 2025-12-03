import { SelectMenu } from "../../types/helpers";
import { Guild } from "../../helpers";
import {
  ActionRowBuilder,
  GuildMember,
  MessageActionRowComponentBuilder,
  StringSelectMenuInteraction,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  PermissionsBitField,
  MessageFlags,
} from "discord.js";
import { t } from "../../i18n/helpers";

module.exports = {
  customId: "I_jtc:down_select",
  permissions: {
    bot: [PermissionsBitField.Flags.ManageChannels],
  },
  run: async (client, interaction: StringSelectMenuInteraction) => {
    if (!interaction.guild) return;
    if (!(interaction.member instanceof GuildMember)) return;
    if (!interaction.member.voice) return;
    if (!interaction.member.voice.channel) return;
    if (!interaction.member.voice.channelId) return;
    let guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    let map = await guild.cache.get("temp.join_to_create.map");

    if (
      map.has(interaction.member.voice.channelId) &&
      //@ts-ignore
      map.get(interaction.member.voice.channelId).owner === interaction.user.id
    ) {
      let channel = interaction.member.voice.channel;
      switch (interaction.values[0]) {
        case "open":
          await channel.permissionOverwrites.create(guild.guild.id, {
            Connect: true,
          });

          await interaction.reply({
            content: t(client, lang, "functions.join_to_create.msg.open"),
            flags: MessageFlags.Ephemeral,
          });
          break;
        case "close":
          await channel.permissionOverwrites.create(guild.guild.id, {
            Connect: false,
          });

          await interaction.reply({
            content: t(client, lang, "functions.join_to_create.msg.close"),
            flags: MessageFlags.Ephemeral,
          });
          break;
        case "add":
          await interaction.reply({
            content: t(client, lang, "functions.join_to_create.select_menus.add.msg"),
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new UserSelectMenuBuilder()
                  .setCustomId("I_jtc:add_select_user")
                  .setPlaceholder(
                    t(client, lang, "functions.join_to_create.select_menus.add.placeholder.user"),
                  ),
              ),
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new RoleSelectMenuBuilder()
                  .setCustomId("I_jtc:add_select_role")
                  .setPlaceholder(
                    t(client, lang, "functions.join_to_create.select_menus.add.placeholder.role"),
                  ),
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          break;
        case "remove":
          await interaction.reply({
            content: t(client, lang, "functions.join_to_create.select_menus.remove.msg"),
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new UserSelectMenuBuilder()
                  .setCustomId("I_jtc:remove_select_user")
                  .setPlaceholder(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.select_menus.remove.placeholder.user",
                    ),
                  ),
              ),
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new RoleSelectMenuBuilder()
                  .setCustomId("I_jtc:remove_select_role")
                  .setPlaceholder(
                    t(
                      client,
                      lang,
                      "functions.join_to_create.select_menus.remove.placeholder.role",
                    ),
                  ),
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          break;
        case "show":
          await channel.permissionOverwrites.create(guild.guild.id, {
            ViewChannel: true,
          });

          await interaction.reply({
            content: t(client, lang, "functions.join_to_create.msg.show"),
            flags: MessageFlags.Ephemeral,
          });
          break;
        case "hide":
          await channel.permissionOverwrites.create(guild.guild.id, {
            ViewChannel: false,
          });

          await interaction.reply({
            content: t(client, lang, "functions.join_to_create.msg.hide"),
            flags: MessageFlags.Ephemeral,
          });
          break;
      }
    } else {
      await interaction.reply({
        content: t(client, lang, "functions.join_to_create.errors.not_owner"),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} as SelectMenu;
