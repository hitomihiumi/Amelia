import { Levels, SlashCommand } from "../../types/helpers";
import {
  Client,
  CommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  MessageFlagsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";

module.exports = {
  name: "levels",
  description: "Setting up the leveling system on the server.",
  cooldown: 5,
  locale: {
    ru: "Настройка системы уровней на сервере.",
    uk: "Налаштування системи рівнів на сервері.",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions, PermissionsBitField.Flags.ManageRoles],
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    let guild = new Guild(client, interaction.guild);

    const lang = await guild.get("settings.language");

    let settings = await mostUsedQueries.getLevelSettings(guild);

    let currentView: "main" | "ignore" | "level_roles" = "main";

    const components = buildComponents(client, lang, settings, currentView);

    let embed = buildEmbed(client, lang, settings, currentView);

    let msg = await interaction.editReply({ embeds: [embed], components });

    const filter = (i: any) => i.user.id === interaction.user.id;

    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      if (i.isButton()) {
        if (i.customId === "NI_levels:toggle") {
          settings.enabled = !settings.enabled;
          await mostUsedQueries.setEnabled(guild, settings.enabled);

          const components = buildComponents(client, lang, settings, currentView);
          embed = buildEmbed(client, lang, settings, currentView);

          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_levels:back") {
          currentView = "main";
          const components = buildComponents(client, lang, settings, currentView);
          embed = buildEmbed(client, lang, settings, currentView);

          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_levels:remove_level_role") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.levels.modals.remove_level_role.title"))
            .setCustomId("NI_levels:remove_level_role_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.levels.modals.remove_level_role.level.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(3)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_levels:level")
                    .setPlaceholder(
                      t(client, lang, "commands.levels.modals.remove_level_role.level.placeholder"),
                    ),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (i: any) =>
                i.user.id === interaction.user.id &&
                i.customId === "NI_levels:remove_level_role_modal",
            })
            .then(async (int) => {
              await int.deferUpdate();

              const level = Number.parseInt(int.fields.getTextInputValue("NI_levels:level"));

              if (Number.isNaN(level) || !settings.level_roles[level]) {
                return await int.followUp({
                  content: t(client, lang, "commands.levels.messages.level_role_not_found"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
              }

              delete settings.level_roles[level];
              await mostUsedQueries.setRoles(guild, settings.level_roles);

              const components = buildComponents(client, lang, settings, currentView);
              embed = buildEmbed(client, lang, settings, currentView);

              await int.editReply({ embeds: [embed], components });
            });
        }
      } else if (i.isStringSelectMenu()) {
        if (i.customId === "NI_levels:main_menu") {
          const value = i.values[0];

          if (value === "ignore") {
            currentView = "ignore";
          } else if (value === "level_roles") {
            currentView = "level_roles";
          }

          const components = buildComponents(client, lang, settings, currentView);
          embed = buildEmbed(client, lang, settings, currentView);

          await i.update({ embeds: [embed], components });
        }
      } else if (i.isChannelSelectMenu()) {
        if (i.customId === "NI_levels:ignore_channels") {
          const channels = i.values;

          if (channels.length > 25) {
            return await i.reply({
              content: t(client, lang, "commands.levels.messages.max_channels"),
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
          }

          settings.ignore_channels = channels;
          await mostUsedQueries.setIgnoreChannels(guild, channels);

          const components = buildComponents(client, lang, settings, currentView);
          embed = buildEmbed(client, lang, settings, currentView);

          await i.update({ embeds: [embed], components });
        }
      } else if (i.isRoleSelectMenu()) {
        if (i.customId === "NI_levels:ignore_roles") {
          const roles = i.values;

          if (roles.length > 25) {
            return await i.reply({
              content: t(client, lang, "commands.levels.messages.max_roles"),
              flags: MessageFlagsBitField.Flags.Ephemeral,
            });
          }

          settings.ignore_roles = roles;
          await mostUsedQueries.setIgnoreRoles(guild, roles);

          const components = buildComponents(client, lang, settings, currentView);
          embed = buildEmbed(client, lang, settings, currentView);

          await i.update({ embeds: [embed], components });
        } else if (i.customId === "NI_levels:select_role_for_level") {
          const roleId = i.values[0];

          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.levels.modals.add_level_role.title"))
            .setCustomId("NI_levels:add_level_role_modal")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.levels.modals.add_level_role.level.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(3)
                    .setStyle(TextInputStyle.Short)
                    .setCustomId("NI_levels:level")
                    .setPlaceholder(
                      t(client, lang, "commands.levels.modals.add_level_role.level.placeholder"),
                    ),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (i: any) =>
                i.user.id === interaction.user.id &&
                i.customId === "NI_levels:add_level_role_modal",
            })
            .then(async (int) => {
              const level = Number.parseInt(int.fields.getTextInputValue("NI_levels:level"));

              if (Number.isNaN(level) || level < 1 || level > 999) {
                await int.reply({
                  content: t(client, lang, "commands.levels.messages.invalid_level"),
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                return;
              }

              settings.level_roles[level] = roleId;
              await mostUsedQueries.setRoles(guild, settings.level_roles);

              const components = buildComponents(client, lang, settings, currentView);
              embed = buildEmbed(client, lang, settings, currentView);

              await int.reply({
                content: t(
                  client,
                  lang,
                  "commands.levels.messages.role_added",
                  level,
                  `<@&${roleId}>`,
                ),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });

              await interaction.editReply({ embeds: [embed], components });
            });
        }
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (error) {
        // Message might be deleted
      }
    });
  },
} as SlashCommand;

function buildEmbed(
  client: Client,
  lang: string,
  settings: Levels,
  view: "main" | "ignore" | "level_roles",
): EmbedBuilder {
  let embed = new EmbedBuilder().setColor(client.holder.colors.default);

  if (view === "main") {
    embed
      .setTitle(t(client, lang, "commands.levels.embeds.base.title"))
      .setDescription(t(client, lang, "commands.levels.embeds.base.description"))
      .addFields({
        name: t(client, lang, "commands.levels.embeds.base.fields.status.name"),
        value: settings.enabled
          ? t(client, lang, "commands.levels.embeds.base.fields.status.enabled")
          : t(client, lang, "commands.levels.embeds.base.fields.status.disabled"),
        inline: true,
      });

    if (settings.enabled) {
      embed.addFields(
        {
          name: t(client, lang, "commands.levels.embeds.base.fields.ignored_channels.name"),
          value:
            settings.ignore_channels.length > 0
              ? settings.ignore_channels.map((c) => `<#${c}>`).join(", ")
              : t(client, lang, "commands.levels.embeds.base.fields.ignored_channels.none"),
          inline: false,
        },
        {
          name: t(client, lang, "commands.levels.embeds.base.fields.ignored_roles.name"),
          value:
            settings.ignore_roles.length > 0
              ? settings.ignore_roles.map((r) => `<@&${r}>`).join(", ")
              : t(client, lang, "commands.levels.embeds.base.fields.ignored_roles.none"),
          inline: false,
        },
        {
          name: t(client, lang, "commands.levels.embeds.base.fields.level_roles.name"),
          value:
            Object.keys(settings.level_roles).length > 0
              ? Object.entries(settings.level_roles)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([level, roleId]) =>
                    t(
                      client,
                      lang,
                      "commands.levels.embeds.base.fields.level_roles.level_format",
                      level,
                      `<@&${roleId}>`,
                    ),
                  )
                  .join("\n")
              : t(client, lang, "commands.levels.embeds.base.fields.level_roles.none"),
          inline: false,
        },
      );
    }
  } else if (view === "ignore") {
    embed
      .setTitle(t(client, lang, "commands.levels.embeds.ignore.title"))
      .setDescription(t(client, lang, "commands.levels.embeds.ignore.description"))
      .addFields(
        {
          name: t(client, lang, "commands.levels.embeds.ignore.fields.ignored_channels.name"),
          value:
            settings.ignore_channels.length > 0
              ? settings.ignore_channels.map((c) => `<#${c}>`).join(", ")
              : t(client, lang, "commands.levels.embeds.ignore.fields.ignored_channels.none"),
          inline: false,
        },
        {
          name: t(client, lang, "commands.levels.embeds.ignore.fields.ignored_roles.name"),
          value:
            settings.ignore_roles.length > 0
              ? settings.ignore_roles.map((r) => `<@&${r}>`).join(", ")
              : t(client, lang, "commands.levels.embeds.ignore.fields.ignored_roles.none"),
          inline: false,
        },
      );
  } else if (view === "level_roles") {
    embed
      .setTitle(t(client, lang, "commands.levels.embeds.level_roles.title"))
      .setDescription(t(client, lang, "commands.levels.embeds.level_roles.description"));

    if (Object.keys(settings.level_roles).length > 0) {
      const rolesText = Object.entries(settings.level_roles)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, roleId]) =>
          t(
            client,
            lang,
            "commands.levels.embeds.level_roles.fields.current_roles.level_format",
            level,
            `<@&${roleId}>`,
          ),
        )
        .join("\n");

      embed.addFields({
        name: t(client, lang, "commands.levels.embeds.level_roles.fields.current_roles.name"),
        value: rolesText,
        inline: false,
      });
    } else {
      embed.addFields({
        name: t(client, lang, "commands.levels.embeds.level_roles.fields.current_roles.name"),
        value: t(client, lang, "commands.levels.embeds.level_roles.fields.current_roles.none"),
        inline: false,
      });
    }
  }

  return embed;
}

function buildComponents(
  client: Client,
  lang: string,
  settings: Levels,
  view: "main" | "ignore" | "level_roles",
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  if (view === "main") {
    // Toggle button row
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_levels:toggle")
        .setLabel(
          settings.enabled
            ? t(client, lang, "commands.levels.buttons.disable")
            : t(client, lang, "commands.levels.buttons.enable"),
        )
        .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    );

    components.push(buttonRow);

    // Main menu
    if (settings.enabled) {
      const menuRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new StringSelectMenuBuilder()
          .setCustomId("NI_levels:main_menu")
          .setPlaceholder(t(client, lang, "commands.levels.select_menus.main.placeholder"))
          .setOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(t(client, lang, "commands.levels.select_menus.main.options.ignore.label"))
              .setDescription(
                t(client, lang, "commands.levels.select_menus.main.options.ignore.description"),
              )
              .setValue("ignore"),
            new StringSelectMenuOptionBuilder()
              .setLabel(
                t(client, lang, "commands.levels.select_menus.main.options.level_roles.label"),
              )
              .setDescription(
                t(
                  client,
                  lang,
                  "commands.levels.select_menus.main.options.level_roles.description",
                ),
              )
              .setValue("level_roles"),
          ),
      );

      components.push(menuRow);
    }
  } else if (view === "ignore") {
    // Channel select menu
    const channelRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("NI_levels:ignore_channels")
        .setPlaceholder(t(client, lang, "commands.levels.select_menus.ignore_channel.placeholder"))
        .setChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
        .setMinValues(0)
        .setMaxValues(25)
        .setDefaultChannels(settings.ignore_channels),
    );

    // Role select menu
    const roleRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("NI_levels:ignore_roles")
        .setPlaceholder(t(client, lang, "commands.levels.select_menus.ignore_role.placeholder"))
        .setMinValues(0)
        .setMaxValues(25)
        .setDefaultRoles(settings.ignore_roles),
    );

    // Back button
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_levels:back")
        .setLabel(t(client, lang, "commands.levels.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );

    components.push(channelRow, roleRow, buttonRow);
  } else if (view === "level_roles") {
    const roleSelectRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(`NI_levels:select_role_for_level`)
        .setPlaceholder(t(client, lang, "commands.levels.select_menus.select_role.placeholder"))
        .setMinValues(1)
        .setMaxValues(1),
    );
    const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_levels:remove_level_role")
        .setLabel(t(client, lang, "commands.levels.buttons.remove_level_role"))
        .setStyle(ButtonStyle.Danger)
        .setDisabled(Object.keys(settings.level_roles).length === 0),
      new ButtonBuilder()
        .setCustomId("NI_levels:back")
        .setLabel(t(client, lang, "commands.levels.buttons.back"))
        .setStyle(ButtonStyle.Secondary),
    );

    components.push(roleSelectRow, buttonRow);
  }

  return components;
}

const mostUsedQueries = {
  getLevelSettings: async (guild: Guild) => {
    return await guild.get("utils.levels");
  },
  setRoles: async (guild: Guild, roles: Levels["level_roles"]) => {
    return await guild.set("utils.levels.level_roles", roles);
  },
  setEnabled: async (guild: Guild, val: boolean) => {
    return await guild.set("utils.levels.enabled", val);
  },
  setIgnoreChannels: async (guild: Guild, channels: string[]) => {
    return await guild.set("utils.levels.ignore_channels", channels);
  },
  setIgnoreRoles: async (guild: Guild, roles: string[]) => {
    return await guild.set("utils.levels.ignore_roles", roles);
  },
};
