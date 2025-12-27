import { SlashCommand } from "../../types/helpers";
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
  GuildChannel,
  ChannelType,
  OverwriteType,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { defaultPermissions, Guild } from "../../helpers";
import { t } from "../../i18n/helpers";
import { prisma } from "../../database";

interface RoleBackupData {
  id: string;
  name: string;
  color: string; // Hex color
  hoist: boolean;
  position: number;
  permissions: string;
  mentionable: boolean;
  members: string[]; // Array of user IDs
}

interface PermissionOverwrite {
  id: string;
  type: OverwriteType;
  allow: string;
  deny: string;
}

interface ChannelBackupData {
  id: string;
  name: string;
  type: ChannelType;
  position: number;
  parentId: string | null;
  topic?: string | null;
  nsfw?: boolean;
  bitrate?: number;
  userLimit?: number;
  rateLimitPerUser?: number;
  permissionOverwrites: PermissionOverwrite[];
}

type ViewType = "main" | "create" | "list" | "view" | "restore_confirm" | "brutal_confirm";

interface BackupData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  createdBy: string;
  roleCount: number;
  channelCount: number;
}

module.exports = {
  name: "backup",
  description: "Create and restore server backups",
  cooldown: 30,
  locale: {
    ru: "Создание и восстановление бэкапов сервера",
    uk: "Створення та відновлення бекапів сервера",
  },
  options: [],
  permissions: {
    bot: [
      ...defaultPermissions,
      PermissionsBitField.Flags.ManageRoles,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.Administrator,
    ],
    user: PermissionsBitField.Flags.Administrator,
  },
  run: async (client: Client, interaction: CommandInteraction) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

    const guild = new Guild(client, interaction.guild);
    const lang = await guild.get("settings.language");

    let currentView: ViewType = "main";
    let selectedBackupId: string | null = null;
    let backups: BackupData[] = [];
    let page = 0;
    const BACKUPS_PER_PAGE = 10;

    // Load backups
    const loadBackups = async () => {
      backups = await prisma.backup.findMany({
        where: { guildId: interaction.guild!.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          createdBy: true,
          roleCount: true,
          channelCount: true,
        },
      });
    };

    await loadBackups();

    const buildEmbed = (): EmbedBuilder => {
      const embed = new EmbedBuilder().setColor(client.holder.colors.default);

      switch (currentView) {
        case "main":
          embed
            .setTitle(t(client, lang, "commands.backup.embeds.main.title") as string)
            .setDescription(t(client, lang, "commands.backup.embeds.main.description") as string)
            .addFields(
              {
                name: t(
                  client,
                  lang,
                  "commands.backup.embeds.main.fields.backups_count.name",
                ) as string,
                value: (
                  t(
                    client,
                    lang,
                    "commands.backup.embeds.main.fields.backups_count.value",
                  ) as string
                ).replace("{0}", String(backups.length)),
                inline: true,
              },
              {
                name: t(client, lang, "commands.backup.embeds.main.fields.warning.name") as string,
                value: t(
                  client,
                  lang,
                  "commands.backup.embeds.main.fields.warning.value",
                ) as string,
                inline: false,
              },
            );
          break;

        case "create":
          embed
            .setTitle(t(client, lang, "commands.backup.embeds.create.title") as string)
            .setDescription(t(client, lang, "commands.backup.embeds.create.description") as string)
            .addFields(
              {
                name: t(client, lang, "commands.backup.embeds.create.fields.roles.name") as string,
                value: (
                  t(client, lang, "commands.backup.embeds.create.fields.roles.value") as string
                ).replace("{0}", String(interaction.guild!.roles.cache.size)),
                inline: true,
              },
              {
                name: t(
                  client,
                  lang,
                  "commands.backup.embeds.create.fields.channels.name",
                ) as string,
                value: (
                  t(client, lang, "commands.backup.embeds.create.fields.channels.value") as string
                ).replace("{0}", String(interaction.guild!.channels.cache.size)),
                inline: true,
              },
              {
                name: t(client, lang, "commands.backup.embeds.create.fields.info.name") as string,
                value: t(client, lang, "commands.backup.embeds.create.fields.info.value") as string,
                inline: false,
              },
            );
          break;

        case "list":
          embed
            .setTitle(t(client, lang, "commands.backup.embeds.list.title") as string)
            .setDescription(t(client, lang, "commands.backup.embeds.list.description") as string);

          if (backups.length === 0) {
            embed.addFields({
              name: t(client, lang, "commands.backup.embeds.list.fields.empty.name") as string,
              value: t(client, lang, "commands.backup.embeds.list.fields.empty.value") as string,
            });
          } else {
            const startIndex = page * BACKUPS_PER_PAGE;
            const pageBackups = backups.slice(startIndex, startIndex + BACKUPS_PER_PAGE);

            const backupsList = pageBackups
              .map(
                (b, i) =>
                  `**${startIndex + i + 1}.** ${b.name}\n└ ${b.roleCount} ${t(client, lang, "commands.backup.embeds.list.roles") as string}, ${b.channelCount} ${t(client, lang, "commands.backup.embeds.list.channels") as string} • <t:${Math.floor(b.createdAt.getTime() / 1000)}:R>`,
              )
              .join("\n\n");

            embed.addFields({
              name: t(client, lang, "commands.backup.embeds.list.fields.backups.name") as string,
              value: backupsList,
            });
          }
          break;

        case "view":
          if (selectedBackupId) {
            const backup = backups.find((b) => b.id === selectedBackupId);
            if (backup) {
              embed
                .setTitle(
                  (t(client, lang, "commands.backup.embeds.view.title") as string).replace(
                    "{0}",
                    backup.name,
                  ),
                )
                .setDescription(
                  backup.description ||
                    (t(client, lang, "commands.backup.embeds.view.no_description") as string),
                )
                .addFields(
                  {
                    name: t(
                      client,
                      lang,
                      "commands.backup.embeds.view.fields.created.name",
                    ) as string,
                    value: `<t:${Math.floor(backup.createdAt.getTime() / 1000)}:F>`,
                    inline: true,
                  },
                  {
                    name: t(
                      client,
                      lang,
                      "commands.backup.embeds.view.fields.created_by.name",
                    ) as string,
                    value: `<@${backup.createdBy}>`,
                    inline: true,
                  },
                  {
                    name: t(
                      client,
                      lang,
                      "commands.backup.embeds.view.fields.roles.name",
                    ) as string,
                    value: String(backup.roleCount),
                    inline: true,
                  },
                  {
                    name: t(
                      client,
                      lang,
                      "commands.backup.embeds.view.fields.channels.name",
                    ) as string,
                    value: String(backup.channelCount),
                    inline: true,
                  },
                );
            }
          }
          break;

        case "restore_confirm":
          embed
            .setTitle(t(client, lang, "commands.backup.embeds.restore_confirm.title") as string)
            .setDescription(
              t(client, lang, "commands.backup.embeds.restore_confirm.description") as string,
            )
            .setColor(0xff0000)
            .addFields(
              {
                name: t(
                  client,
                  lang,
                  "commands.backup.embeds.restore_confirm.fields.warning.name",
                ) as string,
                value: t(
                  client,
                  lang,
                  "commands.backup.embeds.restore_confirm.fields.warning.value",
                ) as string,
              },
              {
                name: t(
                  client,
                  lang,
                  "commands.backup.embeds.restore_confirm.fields.actions.name",
                ) as string,
                value: t(
                  client,
                  lang,
                  "commands.backup.embeds.restore_confirm.fields.actions.value",
                ) as string,
              },
            );
          break;

        case "brutal_confirm":
          embed
            .setTitle(t(client, lang, "commands.backup.embeds.brutal_confirm.title") as string)
            .setDescription(
              t(client, lang, "commands.backup.embeds.brutal_confirm.description") as string,
            )
            .setColor(0xff0000)
            .addFields(
              {
                name: t(
                  client,
                  lang,
                  "commands.backup.embeds.brutal_confirm.fields.warning.name",
                ) as string,
                value: t(
                  client,
                  lang,
                  "commands.backup.embeds.brutal_confirm.fields.warning.value",
                ) as string,
              },
              {
                name: t(
                  client,
                  lang,
                  "commands.backup.embeds.brutal_confirm.fields.deletion.name",
                ) as string,
                value: t(
                  client,
                  lang,
                  "commands.backup.embeds.brutal_confirm.fields.deletion.value",
                ) as string,
              },
              {
                name: t(
                  client,
                  lang,
                  "commands.backup.embeds.brutal_confirm.fields.actions.name",
                ) as string,
                value: t(
                  client,
                  lang,
                  "commands.backup.embeds.brutal_confirm.fields.actions.value",
                ) as string,
              },
            );
          break;
      }

      return embed;
    };

    const buildComponents = (): ActionRowBuilder<MessageActionRowComponentBuilder>[] => {
      const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

      switch (currentView) {
        case "main":
          components.push(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new StringSelectMenuBuilder()
                .setCustomId("NI_backup:menu")
                .setPlaceholder(
                  t(client, lang, "commands.backup.select_menus.main.placeholder") as string,
                )
                .setOptions(
                  new StringSelectMenuOptionBuilder()
                    .setLabel(
                      t(
                        client,
                        lang,
                        "commands.backup.select_menus.main.options.create.label",
                      ) as string,
                    )
                    .setDescription(
                      t(
                        client,
                        lang,
                        "commands.backup.select_menus.main.options.create.description",
                      ) as string,
                    )
                    .setValue("create")
                    .setEmoji("💾"),
                  new StringSelectMenuOptionBuilder()
                    .setLabel(
                      t(
                        client,
                        lang,
                        "commands.backup.select_menus.main.options.list.label",
                      ) as string,
                    )
                    .setDescription(
                      t(
                        client,
                        lang,
                        "commands.backup.select_menus.main.options.list.description",
                      ) as string,
                    )
                    .setValue("list")
                    .setEmoji("📋"),
                ),
            ),
          );
          break;

        case "create":
          components.push(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId("NI_backup:create")
                .setLabel(t(client, lang, "commands.backup.buttons.create") as string)
                .setStyle(ButtonStyle.Success)
                .setEmoji("💾"),
              new ButtonBuilder()
                .setCustomId("NI_backup:back")
                .setLabel(t(client, lang, "commands.backup.buttons.back") as string)
                .setStyle(ButtonStyle.Secondary),
            ),
          );
          break;

        case "list":
          if (backups.length > 0) {
            const startIndex = page * BACKUPS_PER_PAGE;
            const pageBackups = backups.slice(startIndex, startIndex + BACKUPS_PER_PAGE);

            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId("NI_backup:select")
              .setPlaceholder(
                t(client, lang, "commands.backup.select_menus.list.placeholder") as string,
              )
              .setOptions(
                pageBackups.map((b, i) =>
                  new StringSelectMenuOptionBuilder()
                    .setLabel(`${startIndex + i + 1}. ${b.name}`)
                    .setDescription(`${b.roleCount} roles, ${b.channelCount} channels`)
                    .setValue(b.id),
                ),
              );

            components.push(
              new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(selectMenu),
            );
          }

          const totalPages = Math.ceil(backups.length / BACKUPS_PER_PAGE) || 1;
          components.push(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId("NI_backup:prev")
                .setLabel("◀")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0),
              new ButtonBuilder()
                .setCustomId("NI_backup:page")
                .setLabel(`${page + 1}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("NI_backup:next")
                .setLabel("▶")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= totalPages - 1),
              new ButtonBuilder()
                .setCustomId("NI_backup:back")
                .setLabel(t(client, lang, "commands.backup.buttons.back") as string)
                .setStyle(ButtonStyle.Secondary),
            ),
          );
          break;

        case "view":
          components.push(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId("NI_backup:restore")
                .setLabel(t(client, lang, "commands.backup.buttons.restore") as string)
                .setStyle(ButtonStyle.Primary)
                .setEmoji("🔄"),
              new ButtonBuilder()
                .setCustomId("NI_backup:brutal_restore")
                .setLabel(t(client, lang, "commands.backup.buttons.brutal_restore") as string)
                .setStyle(ButtonStyle.Danger)
                .setEmoji("💀"),
              new ButtonBuilder()
                .setCustomId("NI_backup:delete")
                .setLabel(t(client, lang, "commands.backup.buttons.delete") as string)
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🗑️"),
              new ButtonBuilder()
                .setCustomId("NI_backup:back_to_list")
                .setLabel(t(client, lang, "commands.backup.buttons.back") as string)
                .setStyle(ButtonStyle.Secondary),
            ),
          );
          break;

        case "restore_confirm":
          components.push(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId("NI_backup:confirm_restore")
                .setLabel(t(client, lang, "commands.backup.buttons.confirm_restore") as string)
                .setStyle(ButtonStyle.Danger)
                .setEmoji("⚠️"),
              new ButtonBuilder()
                .setCustomId("NI_backup:cancel_restore")
                .setLabel(t(client, lang, "commands.backup.buttons.cancel") as string)
                .setStyle(ButtonStyle.Secondary),
            ),
          );
          break;

        case "brutal_confirm":
          components.push(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId("NI_backup:confirm_brutal")
                .setLabel(t(client, lang, "commands.backup.buttons.confirm_brutal") as string)
                .setStyle(ButtonStyle.Danger)
                .setEmoji("💀"),
              new ButtonBuilder()
                .setCustomId("NI_backup:cancel_restore")
                .setLabel(t(client, lang, "commands.backup.buttons.cancel") as string)
                .setStyle(ButtonStyle.Secondary),
            ),
          );
          break;
      }

      return components;
    };

    const msg = await interaction.editReply({
      embeds: [buildEmbed()],
      components: buildComponents(),
    });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

    collector.on("collect", async (i) => {
      // String Select Menu handlers
      if (i.isStringSelectMenu()) {
        if (i.customId === "NI_backup:menu") {
          currentView = i.values[0] as ViewType;
          await i.update({ embeds: [buildEmbed()], components: buildComponents() });
        } else if (i.customId === "NI_backup:select") {
          selectedBackupId = i.values[0];
          currentView = "view";
          await i.update({ embeds: [buildEmbed()], components: buildComponents() });
        }
      }

      // Button handlers
      if (i.isButton()) {
        switch (i.customId) {
          case "NI_backup:back":
            currentView = "main";
            selectedBackupId = null;
            await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            break;

          case "NI_backup:back_to_list":
            currentView = "list";
            selectedBackupId = null;
            await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            break;

          case "NI_backup:prev":
            page = Math.max(0, page - 1);
            await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            break;

          case "NI_backup:next":
            const totalPages = Math.ceil(backups.length / BACKUPS_PER_PAGE);
            page = Math.min(totalPages - 1, page + 1);
            await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            break;

          case "NI_backup:create":
            // Show modal for backup name
            const createModal = new ModalBuilder()
              .setTitle(t(client, lang, "commands.backup.modals.create.title") as string)
              .setCustomId("NI_backup:create_modal")
              .setLabelComponents(
                new LabelBuilder()
                  .setLabel(t(client, lang, "commands.backup.modals.create.name.label") as string)
                  .setTextInputComponent(
                    new TextInputBuilder()
                      .setCustomId("NI_backup:name")
                      .setPlaceholder(
                        t(client, lang, "commands.backup.modals.create.name.placeholder") as string,
                      )
                      .setStyle(TextInputStyle.Short)
                      .setRequired(true)
                      .setMaxLength(100),
                  ),
                new LabelBuilder()
                  .setLabel(
                    t(client, lang, "commands.backup.modals.create.description.label") as string,
                  )
                  .setTextInputComponent(
                    new TextInputBuilder()
                      .setCustomId("NI_backup:description")
                      .setPlaceholder(
                        t(
                          client,
                          lang,
                          "commands.backup.modals.create.description.placeholder",
                        ) as string,
                      )
                      .setStyle(TextInputStyle.Paragraph)
                      .setRequired(false)
                      .setMaxLength(500),
                  ),
              );

            await i.showModal(createModal);

            try {
              const modalSubmit = await i.awaitModalSubmit({
                time: 5 * 60 * 1000,
                filter: (si: any) =>
                  si.user.id === interaction.user.id && si.customId === "NI_backup:create_modal",
              });

              await modalSubmit.deferUpdate();

              const backupName = modalSubmit.fields.getTextInputValue("NI_backup:name");
              const backupDescription =
                modalSubmit.fields.getTextInputValue("NI_backup:description") || null;

              // Create backup
              const rolesData: RoleBackupData[] = [];
              const channelsData: ChannelBackupData[] = [];

              // Backup roles (exclude @everyone and managed roles)
              const roles = interaction
                .guild!.roles.cache.filter(
                  (role) => role.id !== interaction.guild!.id && !role.managed,
                )
                .sort((a, b) => b.position - a.position);

              for (const [, role] of roles) {
                const members = role.members.map((m) => m.id);
                rolesData.push({
                  id: role.id,
                  name: role.name,
                  color: role.hexColor,
                  hoist: role.hoist,
                  position: role.position,
                  permissions: role.permissions.bitfield.toString(),
                  mentionable: role.mentionable,
                  members,
                });
              }

              // Backup channels
              const channels = interaction
                .guild!.channels.cache.filter((channel) => !channel.isThread()) // Exclude threads
                .sort((a, b) => {
                  // Sort categories first, then by position
                  if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory)
                    return -1;
                  if (a.type !== ChannelType.GuildCategory && b.type === ChannelType.GuildCategory)
                    return 1;
                  const aPos = "position" in a ? a.position : 0;
                  const bPos = "position" in b ? b.position : 0;
                  return aPos - bPos;
                });

              for (const [, channel] of channels) {
                const guildChannel = channel as GuildChannel;
                const permissionOverwrites: PermissionOverwrite[] = [];

                guildChannel.permissionOverwrites.cache.forEach((overwrite) => {
                  permissionOverwrites.push({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.bitfield.toString(),
                    deny: overwrite.deny.bitfield.toString(),
                  });
                });

                const channelData: ChannelBackupData = {
                  id: guildChannel.id,
                  name: guildChannel.name,
                  type: guildChannel.type,
                  position: guildChannel.position,
                  parentId: guildChannel.parentId,
                  permissionOverwrites,
                };

                // Add type-specific properties
                if ("topic" in guildChannel) {
                  channelData.topic = (guildChannel as TextChannel).topic;
                }
                if ("nsfw" in guildChannel) {
                  channelData.nsfw = (guildChannel as TextChannel).nsfw;
                }
                if ("bitrate" in guildChannel) {
                  channelData.bitrate = (guildChannel as VoiceChannel).bitrate;
                }
                if ("userLimit" in guildChannel) {
                  channelData.userLimit = (guildChannel as VoiceChannel).userLimit;
                }
                if ("rateLimitPerUser" in guildChannel) {
                  channelData.rateLimitPerUser = (guildChannel as TextChannel).rateLimitPerUser;
                }

                channelsData.push(channelData);
              }

              // Save to database
              await prisma.backup.create({
                data: {
                  guildId: interaction.guild!.id,
                  createdBy: interaction.user.id,
                  name: backupName,
                  description: backupDescription,
                  roles: rolesData as any,
                  channels: channelsData as any,
                  roleCount: rolesData.length,
                  channelCount: channelsData.length,
                },
              });

              await loadBackups();
              currentView = "main";

              await modalSubmit.followUp({
                content: (t(client, lang, "commands.backup.messages.created") as string).replace(
                  "{0}",
                  backupName,
                ),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });

              await interaction.editReply({
                embeds: [buildEmbed()],
                components: buildComponents(),
              });
            } catch (error) {
              // Modal timed out
            }
            break;

          case "NI_backup:delete":
            if (selectedBackupId) {
              await prisma.backup.delete({ where: { id: selectedBackupId } });
              await loadBackups();
              currentView = "list";
              selectedBackupId = null;

              await i.update({ embeds: [buildEmbed()], components: buildComponents() });
              await i.followUp({
                content: t(client, lang, "commands.backup.messages.deleted") as string,
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
            }
            break;

          case "NI_backup:restore":
            currentView = "restore_confirm";
            await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            break;

          case "NI_backup:brutal_restore":
            currentView = "brutal_confirm";
            await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            break;

          case "NI_backup:cancel_restore":
            currentView = "view";
            await i.update({ embeds: [buildEmbed()], components: buildComponents() });
            break;

          case "NI_backup:confirm_restore":
            if (!selectedBackupId) break;

            await i.deferUpdate();

            try {
              const backup = await prisma.backup.findUnique({
                where: { id: selectedBackupId },
              });

              if (!backup) {
                await i.followUp({
                  content: t(client, lang, "commands.backup.messages.not_found") as string,
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                break;
              }

              const rolesData = backup.roles as unknown as RoleBackupData[];
              const channelsData = backup.channels as unknown as ChannelBackupData[];

              // Map old role IDs to new/existing role IDs
              const roleIdMap = new Map<string, string>();

              // Create roles (in reverse order to maintain hierarchy)
              const sortedRoles = [...rolesData].sort((a, b) => a.position - b.position);

              for (const roleData of sortedRoles) {
                try {
                  // Check if role with same name and color already exists
                  const existingRole = interaction.guild!.roles.cache.find(
                    (r) => r.name === roleData.name && r.hexColor === roleData.color,
                  );

                  if (existingRole) {
                    // Use existing role
                    roleIdMap.set(roleData.id, existingRole.id);

                    // Update role permissions if different
                    if (existingRole.permissions.bitfield.toString() !== roleData.permissions) {
                      await existingRole.setPermissions(
                        BigInt(roleData.permissions),
                        `Backup restore: ${backup.name}`,
                      );
                    }

                    // Assign role to members who don't have it
                    for (const memberId of roleData.members) {
                      try {
                        const member = await interaction.guild!.members.fetch(memberId);
                        if (member && !member.roles.cache.has(existingRole.id)) {
                          await member.roles.add(existingRole, `Backup restore: ${backup.name}`);
                        }
                      } catch {
                        // Member not found or can't assign role
                      }
                    }
                  } else {
                    // Create new role
                    const newRole = await interaction.guild!.roles.create({
                      name: roleData.name,
                      color: roleData.color as `#${string}`,
                      hoist: roleData.hoist,
                      permissions: BigInt(roleData.permissions),
                      mentionable: roleData.mentionable,
                      reason: `Backup restore: ${backup.name}`,
                    });

                    roleIdMap.set(roleData.id, newRole.id);

                    // Assign role to members
                    for (const memberId of roleData.members) {
                      try {
                        const member = await interaction.guild!.members.fetch(memberId);
                        if (member) {
                          await member.roles.add(newRole, `Backup restore: ${backup.name}`);
                        }
                      } catch {
                        // Member not found or can't assign role
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Failed to create/update role ${roleData.name}:`, error);
                }
              }

              // Map old channel IDs to new/existing channel IDs (for parent references)
              const channelIdMap = new Map<string, string>();

              // Create categories first
              const categories = channelsData.filter((c) => c.type === ChannelType.GuildCategory);
              for (const channelData of categories) {
                try {
                  // Check if category with same name already exists
                  const existingCategory = interaction.guild!.channels.cache.find(
                    (c) => c.type === ChannelType.GuildCategory && c.name === channelData.name,
                  );

                  if (existingCategory) {
                    // Use existing category
                    channelIdMap.set(channelData.id, existingCategory.id);
                  } else {
                    // Create new category
                    const permissionOverwrites = channelData.permissionOverwrites.map((perm) => ({
                      id: roleIdMap.get(perm.id) || perm.id,
                      type: perm.type,
                      allow: BigInt(perm.allow),
                      deny: BigInt(perm.deny),
                    }));

                    const newChannel = await interaction.guild!.channels.create({
                      name: channelData.name,
                      type: ChannelType.GuildCategory,
                      position: channelData.position,
                      permissionOverwrites,
                      reason: `Backup restore: ${backup.name}`,
                    });

                    channelIdMap.set(channelData.id, newChannel.id);
                  }
                } catch (error) {
                  console.error(`Failed to create category ${channelData.name}:`, error);
                }
              }

              // Create other channels
              const otherChannels = channelsData.filter(
                (c) => c.type !== ChannelType.GuildCategory,
              );
              for (const channelData of otherChannels) {
                try {
                  // Get parent ID from map or backup
                  const parentId = channelData.parentId
                    ? channelIdMap.get(channelData.parentId) || channelData.parentId
                    : null;

                  // Check if channel with same name, type and parent already exists
                  const existingChannel = interaction.guild!.channels.cache.find(
                    (c) =>
                      c.name === channelData.name &&
                      c.type === channelData.type &&
                      c.parentId === parentId,
                  );

                  if (existingChannel) {
                    // Channel already exists, skip creation
                    continue;
                  }

                  // Create new channel
                  const permissionOverwrites = channelData.permissionOverwrites.map((perm) => ({
                    id: roleIdMap.get(perm.id) || perm.id,
                    type: perm.type,
                    allow: BigInt(perm.allow),
                    deny: BigInt(perm.deny),
                  }));

                  const options: any = {
                    name: channelData.name,
                    type: channelData.type,
                    position: channelData.position,
                    parent: parentId,
                    permissionOverwrites,
                    reason: `Backup restore: ${backup.name}`,
                  };

                  if (channelData.topic) options.topic = channelData.topic;
                  if (channelData.nsfw !== undefined) options.nsfw = channelData.nsfw;
                  if (channelData.bitrate) options.bitrate = channelData.bitrate;
                  if (channelData.userLimit !== undefined)
                    options.userLimit = channelData.userLimit;
                  if (channelData.rateLimitPerUser !== undefined)
                    options.rateLimitPerUser = channelData.rateLimitPerUser;

                  await interaction.guild!.channels.create(options);
                } catch (error) {
                  console.error(`Failed to create channel ${channelData.name}:`, error);
                }
              }

              currentView = "main";
              selectedBackupId = null;

              await i.followUp({
                content: (t(client, lang, "commands.backup.messages.restored") as string).replace(
                  "{0}",
                  backup.name,
                ),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });

              await interaction.editReply({
                embeds: [buildEmbed()],
                components: buildComponents(),
              });
            } catch (error) {
              console.error("Backup restore failed:", error);
              await i.followUp({
                content: t(client, lang, "commands.backup.messages.restore_failed") as string,
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
            }
            break;

          case "NI_backup:confirm_brutal":
            if (!selectedBackupId) break;

            await i.deferUpdate();

            try {
              const backup = await prisma.backup.findUnique({
                where: { id: selectedBackupId },
              });

              if (!backup) {
                await i.followUp({
                  content: t(client, lang, "commands.backup.messages.not_found") as string,
                  flags: MessageFlagsBitField.Flags.Ephemeral,
                });
                break;
              }

              const rolesData = backup.roles as unknown as RoleBackupData[];
              const channelsData = backup.channels as unknown as ChannelBackupData[];

              // BRUTAL MODE: Delete all channels first (except the channel where the command was run)
              const commandChannelId = interaction.channelId;
              for (const [, channel] of interaction.guild!.channels.cache) {
                if (channel.id === commandChannelId) continue; // Don't delete the command channel
                if (channel.isThread()) continue; // Skip threads
                try {
                  await channel.delete(`Brutal backup restore: ${backup.name}`);
                } catch (error) {
                  console.error(`Failed to delete channel ${channel.name}:`, error);
                }
              }

              // BRUTAL MODE: Delete all roles (except @everyone and managed roles)
              for (const [, role] of interaction.guild!.roles.cache) {
                if (role.id === interaction.guild!.id) continue; // @everyone
                if (role.managed) continue; // Bot roles, integration roles, etc.
                if (role.position >= interaction.guild!.members.me!.roles.highest.position)
                  continue; // Can't delete roles above bot
                try {
                  await role.delete(`Brutal backup restore: ${backup.name}`);
                } catch (error) {
                  console.error(`Failed to delete role ${role.name}:`, error);
                }
              }

              // Map old role IDs to new role IDs
              const roleIdMap = new Map<string, string>();

              // Create all roles from backup
              const sortedRoles = [...rolesData].sort((a, b) => a.position - b.position);

              for (const roleData of sortedRoles) {
                try {
                  const newRole = await interaction.guild!.roles.create({
                    name: roleData.name,
                    color: roleData.color as `#${string}`,
                    hoist: roleData.hoist,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable,
                    reason: `Brutal backup restore: ${backup.name}`,
                  });

                  roleIdMap.set(roleData.id, newRole.id);

                  // Assign role to members
                  for (const memberId of roleData.members) {
                    try {
                      const member = await interaction.guild!.members.fetch(memberId);
                      if (member) {
                        await member.roles.add(newRole, `Brutal backup restore: ${backup.name}`);
                      }
                    } catch {
                      // Member not found or can't assign role
                    }
                  }
                } catch (error) {
                  console.error(`Failed to create role ${roleData.name}:`, error);
                }
              }

              // Map old channel IDs to new channel IDs
              const channelIdMap = new Map<string, string>();

              // Create categories first
              const categories = channelsData.filter((c) => c.type === ChannelType.GuildCategory);
              for (const channelData of categories) {
                try {
                  const permissionOverwrites = channelData.permissionOverwrites.map((perm) => ({
                    id: roleIdMap.get(perm.id) || perm.id,
                    type: perm.type,
                    allow: BigInt(perm.allow),
                    deny: BigInt(perm.deny),
                  }));

                  const newChannel = await interaction.guild!.channels.create({
                    name: channelData.name,
                    type: ChannelType.GuildCategory,
                    position: channelData.position,
                    permissionOverwrites,
                    reason: `Brutal backup restore: ${backup.name}`,
                  });

                  channelIdMap.set(channelData.id, newChannel.id);
                } catch (error) {
                  console.error(`Failed to create category ${channelData.name}:`, error);
                }
              }

              // Create other channels
              const otherChannels = channelsData.filter(
                (c) => c.type !== ChannelType.GuildCategory,
              );
              for (const channelData of otherChannels) {
                try {
                  const permissionOverwrites = channelData.permissionOverwrites.map((perm) => ({
                    id: roleIdMap.get(perm.id) || perm.id,
                    type: perm.type,
                    allow: BigInt(perm.allow),
                    deny: BigInt(perm.deny),
                  }));

                  const parentId = channelData.parentId
                    ? channelIdMap.get(channelData.parentId)
                    : undefined;

                  const options: any = {
                    name: channelData.name,
                    type: channelData.type,
                    position: channelData.position,
                    parent: parentId,
                    permissionOverwrites,
                    reason: `Brutal backup restore: ${backup.name}`,
                  };

                  if (channelData.topic) options.topic = channelData.topic;
                  if (channelData.nsfw !== undefined) options.nsfw = channelData.nsfw;
                  if (channelData.bitrate) options.bitrate = channelData.bitrate;
                  if (channelData.userLimit !== undefined)
                    options.userLimit = channelData.userLimit;
                  if (channelData.rateLimitPerUser !== undefined)
                    options.rateLimitPerUser = channelData.rateLimitPerUser;

                  await interaction.guild!.channels.create(options);
                } catch (error) {
                  console.error(`Failed to create channel ${channelData.name}:`, error);
                }
              }

              currentView = "main";
              selectedBackupId = null;

              await i.followUp({
                content: (
                  t(client, lang, "commands.backup.messages.brutal_restored") as string
                ).replace("{0}", backup.name),
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });

              await interaction.editReply({
                embeds: [buildEmbed()],
                components: buildComponents(),
              });
            } catch (error) {
              console.error("Brutal backup restore failed:", error);
              await i.followUp({
                content: t(
                  client,
                  lang,
                  "commands.backup.messages.brutal_restore_failed",
                ) as string,
                flags: MessageFlagsBitField.Flags.Ephemeral,
              });
            }
            break;
        }
      }
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {
        // Message might be deleted
      }
    });
  },
} as SlashCommand;
