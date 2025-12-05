import { AnySlash, SlashCommand } from "../../types/helpers";
import {
  Client,
  CommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageActionRowComponentBuilder,
  RoleSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  ButtonInteraction,
  StringSelectMenuInteraction,
  Collection,
  RoleSelectMenuInteraction,
  Guild as DJSGuild,
  MessageFlagsBitField,
  LabelBuilder,
  MessageFlags,
} from "discord.js";
import { Guild } from "../../helpers";
import { CommandPermission } from "../../types/helpers";
import { translatePermission } from "../../handlers/functions";
import { t } from "../../i18n/helpers";

const defaultPermissions = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.ManageMessages,
];

module.exports = {
  name: "permissions",
  description: "Control panel for command availability",
  cooldown: 5,
  locale: {
    ru: "Панель управления доступностью команд",
  },
  options: [],
  permissions: {
    bot: [...defaultPermissions],
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    let guild = new Guild(client, interaction.guild);

    const lang = (await guild.get(`settings.language`)) as string;
    let page = 0;
    let permission = {} as CommandPermission;
    let temp = {} as { id: string; type: "deny" | "allow" };
    let command = {} as AnySlash;
    let back = "main";

    let embed = new EmbedBuilder()
      .setTitle(t(client, lang, "commands.permissions.embeds.base.title"))
      .setDescription(t(client, lang, "commands.permissions.embeds.base.description"))
      .setColor(client.holder.colors.default);

    let backButton = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_permissions:back")
        .setLabel(t(client, lang, "commands.permissions.buttons.back"))
        .setEmoji("🔙")
        .setStyle(ButtonStyle.Secondary),
    );
    let rolesSelect = permissionRoles(client, guild, lang, permission);
    let permissionsSelect = permissionsList(client, lang, permission);
    let commandsSelect = await commandsList(client, guild, lang, page);
    let pageControl = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("NI_permissions:page:prev")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("NI_permissions:page:jump")
        .setLabel(`${page + 1}/${Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25)}`)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("NI_permissions:page:next")
        .setEmoji("➡️")
        .setStyle(ButtonStyle.Primary),
    );

    let msg = await interaction.editReply({
      embeds: [embed],
      components: [pageControl, commandsSelect],
    });

    const filter = (i: any) => i.user.id === interaction.user.id;

    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      if (i.isButton()) {
        if (i.customId === "NI_permissions:page:prev") {
          page--;
          if (page < 0) page = 0;

          commandsSelect = await commandsList(client, guild, lang, page);
          // @ts-ignore
          pageControl.components[1].setLabel(
            `${page + 1}/${Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25)}`,
          );

          await i.update({ components: [pageControl, commandsSelect] });
        } else if (i.customId === "NI_permissions:page:next") {
          page++;
          if (page > Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25))
            page = Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25) - 1;

          commandsSelect = await commandsList(client, guild, lang, page);
          // @ts-ignore
          pageControl.components[1].setLabel(
            `${page + 1}/${Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25)}`,
          );

          await i.update({ components: [pageControl, commandsSelect] });
        } else if (i.customId === "NI_permissions:page:jump") {
          let modal = new ModalBuilder()
            .setTitle(t(client, lang, "commands.permissions.modals.jump.title"))
            .setCustomId("NI_permissions:modal:jump")
            .setLabelComponents(
              new LabelBuilder()
                .setLabel(t(client, lang, "commands.permissions.modals.jump.label"))
                .setTextInputComponent(
                  new TextInputBuilder()
                    .setCustomId("NI_permissions:text:jump")
                    .setPlaceholder(
                      `1-${Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25)}`,
                    )
                    .setStyle(TextInputStyle.Short),
                ),
            );

          await i.showModal(modal);

          await i
            .awaitModalSubmit({
              time: 5 * 60 * 1000,
              filter: (i: any) =>
                i.user.id === interaction.user.id && i.customId === "NI_permissions:page:jump",
            })
            .then(async (int) => {
              await int.deferUpdate();
              let jump = parseInt(int.fields.getTextInputValue("NI_permissions:text:jump")) - 1;

              page =
                jump < 0
                  ? 0
                  : jump > Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25)
                    ? Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25)
                    : jump;

              commandsSelect = await commandsList(client, guild, lang, page);
              // @ts-ignore
              pageControl.components[1].setLabel(
                `${page + 1}/${Math.ceil(client.holder.cmds.slashCommands.toJSON().length / 25)}`,
              );

              await int.editReply({ components: [pageControl, commandsSelect] });
            });
        } else if (i.customId === "NI_permissions:back") {
          if (back === "main") {
            embed
              .setTitle(t(client, lang, "commands.permissions.embeds.base.title"))
              .setDescription(t(client, lang, "commands.permissions.embeds.base.description"))
              .setColor(client.holder.colors.default);

            commandsSelect = await commandsList(client, guild, lang, page);

            await i.update({ components: [pageControl, commandsSelect], embeds: [embed] });
          } else if (back === "command") {
            back = "main";

            permissionsSelect = permissionsList(client, lang, permission);
            rolesSelect = permissionRoles(client, guild, lang, permission);

            embed
              .setTitle(t(client, lang, "commands.permissions.embeds.command.title", command.name))
              .setDescription(
                t(
                  client,
                  lang,
                  "commands.permissions.embeds.command.description",
                  command.name,
                  // @ts-ignore
                  (command.locale ? command.locale[lang] : command.description) ||
                    command.description,
                ),
              )
              .setColor(client.holder.colors.default);

            await i.update({
              components: [permissionsSelect, rolesSelect, backButton],
              embeds: [embed],
            });
          }
        } else if (i.customId === "NI_permissions:role:delete") {
          permission.roles = permission.roles.filter((role) => role.id !== temp.id);

          await mostUsedQueries.setPermission(guild, command.name, permission);

          rolesSelect = permissionRoles(client, guild, lang, permission);

          await i.update({
            embeds: [embed],
            components: [
              permissionsSelect,
              rolesSelect,
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:submit")
                  .setLabel(t(client, lang, "commands.permissions.buttons.submit"))
                  .setEmoji("✔️")
                  .setStyle(ButtonStyle.Success),
              ),
              backButton,
            ],
          });
        } else if (i.customId === "NI_permissions:role:type") {
          if (temp.type === "allow") {
            temp.type = "deny";
          } else {
            temp.type = "allow";
          }

          let roleSelect = new RoleSelectMenuBuilder()
            .setCustomId("NI_permissions:role")
            .setPlaceholder(t(client, lang, "commands.permissions.select_menus.role.placeholder"))
            .setMaxValues(1);
          if (temp.id.length > 0) roleSelect.setDefaultRoles([temp.id]);

          embed
            .setTitle(t(client, lang, "commands.permissions.embeds.role.title", command.name))
            .setDescription(
              t(
                client,
                lang,
                "commands.permissions.embeds.role.description",
                command.name,
                temp.type === "allow"
                  ? t(client, lang, "commands.permissions.buttons.deny")
                  : t(client, lang, "commands.permissions.buttons.allow"),
              ),
            )
            .setColor(client.holder.colors.default);

          await i.update({
            embeds: [embed],
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(roleSelect),
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:delete")
                  .setLabel(t(client, lang, "commands.permissions.buttons.delete"))
                  .setEmoji("🗑️")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:type")
                  .setLabel(
                    temp.type === "allow"
                      ? t(client, lang, "commands.permissions.buttons.deny")
                      : t(client, lang, "commands.permissions.buttons.allow"),
                  )
                  .setEmoji("🔘")
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:submit")
                  .setLabel(t(client, lang, "commands.permissions.buttons.submit"))
                  .setEmoji("✔️")
                  .setStyle(ButtonStyle.Success),
              ),
              backButton,
            ],
          });
        } else if (i.customId === "NI_permissions:role:submit") {
          if (back === "command") {
            if (temp.id.length > 0) {
              let role = permission.roles.find((role) => role.id === temp.id);
              if (role) {
                role.type = temp.type;
              } else {
                permission.roles.push(temp);
              }
            } else {
              return i.followUp({
                content: t(client, lang, "commands.permissions.messages.role.error"),
                flags: MessageFlags.Ephemeral,
              });
            }
          }

          await mostUsedQueries.setPermission(guild, command.name, permission);

          rolesSelect = permissionRoles(client, guild, lang, permission);

          permissionsSelect = permissionsList(client, lang, permission);
          rolesSelect = permissionRoles(client, guild, lang, permission);

          back = "main";

          embed
            .setTitle(t(client, lang, "commands.permissions.embeds.command.title", command.name))
            .setDescription(
              t(
                client,
                lang,
                "commands.permissions.embeds.command.description",
                command.name,
                // @ts-ignore
                (command.locale ? command.locale[lang] : command.description) ||
                  command.description,
              ),
            )
            .setColor(client.holder.colors.default);

          await i.update({
            embeds: [embed],
            components: [
              permissionsSelect,
              rolesSelect,
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:submit")
                  .setLabel(t(client, lang, "commands.permissions.buttons.submit"))
                  .setEmoji("✔️")
                  .setStyle(ButtonStyle.Success),
              ),
              backButton,
            ],
          });
        }
      } else if (i.isStringSelectMenu()) {
        if (i.customId === "NI_permissions:commands") {
          back = "main";

          command = client.holder.cmds.slashCommands.get(i.values[0]) as AnySlash;

          permission = ((await mostUsedQueries.getPermission(guild, command.name)) || {
            name: command.name,
            roles: [],
            permission: command.permissions?.user,
          }) as CommandPermission;

          permissionsSelect = permissionsList(client, lang, permission);
          rolesSelect = permissionRoles(client, guild, lang, permission);

          embed
            .setTitle(t(client, lang, "commands.permissions.embeds.command.title", command.name))
            .setDescription(
              t(
                client,
                lang,
                "commands.permissions.embeds.command.description",
                command.name,
                // @ts-ignore
                (command.locale ? command.locale[lang] : command.description) ||
                  command.description,
              ),
            )
            .setColor(client.holder.colors.default);

          await i.update({
            embeds: [embed],
            components: [
              permissionsSelect,
              rolesSelect,
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:submit")
                  .setLabel(t(client, lang, "commands.permissions.buttons.submit"))
                  .setEmoji("✔️")
                  .setStyle(ButtonStyle.Success),
              ),
              backButton,
            ],
          });
        } else if (i.customId === "NI_permissions:permissions") {
          permission.permission = BigInt(i.values[0]);

          await mostUsedQueries.setPermission(guild, command.name, permission);

          permissionsSelect = permissionsList(client, lang, permission);

          await i.update({
            embeds: [embed],
            components: [
              permissionsSelect,
              rolesSelect,
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:submit")
                  .setLabel(t(client, lang, "commands.permissions.buttons.submit"))
                  .setEmoji("✔️")
                  .setStyle(ButtonStyle.Success),
              ),
              backButton,
            ],
          });
        } else if (i.customId === "NI_permissions:roles") {
          back = "command";

          if (i.values[0] === "add") {
            temp = { id: "", type: "allow" };
          } else {
            temp = permission.roles.find((role) => role.id === i.values[0]) || {
              id: "",
              type: "allow",
            };
          }
          let roleSelect = new RoleSelectMenuBuilder()
            .setCustomId("NI_permissions:role")
            .setPlaceholder(t(client, lang, "commands.permissions.select_menus.role.placeholder"))
            .setMaxValues(1);
          if (temp.id.length > 0) roleSelect.setDefaultRoles([temp.id]);

          embed
            .setTitle(t(client, lang, "commands.permissions.embeds.role.title", command.name))
            .setDescription(
              t(
                client,
                lang,
                "commands.permissions.embeds.role.description",
                command.name,
                temp.type === "allow"
                  ? t(client, lang, "commands.permissions.buttons.deny")
                  : t(client, lang, "commands.permissions.buttons.allow"),
              ),
            )
            .setColor(client.holder.colors.default);

          await i.update({
            embeds: [embed],
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(roleSelect),
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:delete")
                  .setLabel(t(client, lang, "commands.permissions.buttons.delete"))
                  .setEmoji("🗑️")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:type")
                  .setLabel(
                    temp.type === "allow"
                      ? t(client, lang, "commands.permissions.buttons.deny")
                      : t(client, lang, "commands.permissions.buttons.allow"),
                  )
                  .setEmoji("🔘")
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:submit")
                  .setLabel(t(client, lang, "commands.permissions.buttons.submit"))
                  .setEmoji("✔️")
                  .setStyle(ButtonStyle.Success),
              ),
              backButton,
            ],
          });
        }
      } else if (i.isRoleSelectMenu()) {
        if (i.customId === "NI_permissions:role") {
          if (
            (temp = permission.roles.find((role) => {
              role.id === i.values[0];
            }) || { id: i.values[0], type: "allow" })
          ) {
          }

          let roleSelect = new RoleSelectMenuBuilder()
            .setCustomId("NI_permissions:role")
            .setPlaceholder(t(client, lang, "commands.permissions.select_menus.role.placeholder"))
            .setMaxValues(1)
            .setDefaultRoles([temp.id]);

          embed
            .setTitle(t(client, lang, "commands.permissions.embeds.role.title", command.name))
            .setDescription(
              t(
                client,
                lang,
                "commands.permissions.embeds.role.description",
                command.name,
                temp.type === "allow"
                  ? t(client, lang, "commands.permissions.buttons.deny")
                  : t(client, lang, "commands.permissions.buttons.allow"),
              ),
            )
            .setColor(client.holder.colors.default);

          await i.update({
            embeds: [embed],
            components: [
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(roleSelect),
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:delete")
                  .setLabel(t(client, lang, "commands.permissions.buttons.delete"))
                  .setEmoji("🗑️")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:type")
                  .setLabel(
                    temp.type === "allow"
                      ? t(client, lang, "commands.permissions.buttons.deny")
                      : t(client, lang, "commands.permissions.buttons.allow"),
                  )
                  .setEmoji("🔘")
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId("NI_permissions:role:submit")
                  .setLabel(t(client, lang, "commands.permissions.buttons.submit"))
                  .setEmoji("✔️")
                  .setStyle(ButtonStyle.Success),
              ),
              backButton,
            ],
          });
        }
      }
    });
  },
} as SlashCommand;

async function commandsList(client: Client, guild: Guild, lang: string, page: number) {
  let commands = client.holder.cmds.slashCommands.toJSON().slice(page * 10, page * 10 + 25);
  let commandsSelect = new StringSelectMenuBuilder()
    .setCustomId("NI_permissions:commands")
    .setPlaceholder(t(client, lang, "commands.permissions.select_menus.commands.placeholder"))
    .setMaxValues(1);

  for (const cmd of commands) {
    let perm = (await mostUsedQueries.getPermission(guild, cmd.name)) as
      | CommandPermission
      | undefined;
    commandsSelect.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(cmd.name)
        .setValue(`${cmd.name}`)
        .setEmoji(
          perm !== undefined
            ? client.holder.emojis.discord["on"]
            : client.holder.emojis.discord["none"],
        )
        // @ts-ignore
        .setDescription(
          perm !== undefined
            ? t(client, lang, "commands.permissions.select_menus.commands.description")
            : cmd.locale
              ? cmd.locale[lang]
              : cmd.description,
        ),
    );
  }

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(commandsSelect);
}

function permissionsList(client: Client, lang: string, permission: CommandPermission) {
  let permissionsSelect = new StringSelectMenuBuilder()
    .setCustomId("NI_permissions:permissions")
    .setPlaceholder(t(client, lang, "commands.permissions.select_menus.permissions.placeholder"))
    .setMaxValues(1);

  defaultPermissions.forEach((perm) => {
    permissionsSelect.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(translatePermission(client, lang, perm))
        .setValue(`${String(perm)}`)
        .setDefault(permission.permission === perm),
    );
  });

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(permissionsSelect);
}

function permissionRoles(
  client: Client,
  guild: Guild,
  lang: string,
  permission: CommandPermission,
) {
  let rolesSelect = new StringSelectMenuBuilder()
    .setCustomId("NI_permissions:roles")
    .setPlaceholder(t(client, lang, "commands.permissions.select_menus.roles.placeholder"))
    .setMaxValues(1);

  if (permission?.roles?.length > 0) {
    permission.roles.forEach((role) => {
      rolesSelect.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${guild.guild.roles.cache.get(role.id)?.name}`)
          .setEmoji(
            role.type === "allow"
              ? client.holder.emojis.discord["on"]
              : client.holder.emojis.discord["off"],
          )
          .setDescription(
            role.type === "allow"
              ? t(client, lang, "commands.permissions.select_menus.roles.allow")
              : t(client, lang, "commands.permissions.select_menus.roles.deny"),
          )
          .setValue(role.id),
      );
    });
  }

  if (rolesSelect.options.length < 25) {
    rolesSelect.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(t(client, lang, "commands.permissions.select_menus.roles.add"))
        .setEmoji("➕")
        .setValue("add"),
    );
  }

  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(rolesSelect);
}

const mostUsedQueries = {
  getPermission: async (guild: Guild, commandName: string) => {
    return (await guild.get(`permissions.commands.${commandName}`)) as unknown as CommandPermission;
  },
  setPermission: async (
    guild: Guild,
    commandName: string,
    commandPermissions: CommandPermission,
  ) => {
    return await guild.set(`permissions.commands.${commandName}`, commandPermissions);
  },
};
