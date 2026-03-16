import fs from "node:fs";
import path from "node:path";
import { Guild } from "../helpers";
import {Command, Component, GetSchemaValueType, Levels, SlashCommand} from "../types/helpers";
import {
  Client,
  Collection,
  Message,
  EmbedBuilder,
  PermissionsBitField,
  ColorResolvable,
  APIButtonComponent,
  ButtonBuilder,
  ActionRowBuilder,
  APIChannelSelectComponent,
  APIUserSelectComponent,
  APIRoleSelectComponent,
  APIStringSelectComponent,
  ChannelSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageActionRowComponentBuilder,
  SelectMenuComponentOptionData,
  GuildMember,
} from "discord.js";
import { APIEmbed, MessageFlags } from "discord-api-types/v10";
import { t, tObject } from "../i18n/helpers";
import { en } from "../i18n/locales/en";
import { ru } from "../i18n/locales/ru";
import { uk } from "../i18n/locales/uk";
import {TranslationSchema} from "../types/i18n/TranslationSchema";

export function foldersCheck() {
  let folders = [
    {
      name: "commands",
      path: "../",
    },
    {
      name: "components",
      path: "../",
    },
    {
      name: "button",
      path: "../components",
    },
    {
      name: "modals",
      path: "../components",
    },
    {
      name: "selectMenus",
      path: "../components",
    },
    {
      name: "autocompletes",
      path: "../components",
    },
    {
      name: "events",
      path: "../",
    },
    {
      name: "client",
      path: "../events",
    },
    {
      name: "guild",
      path: "../events",
    },
  ];

  folders.forEach((folder) => {
    if (!fs.existsSync(path.resolve(__dirname, folder.path, folder.name))) {
      fs.mkdirSync(path.resolve(__dirname, folder.path, folder.name));
    }
  });
}

export function onCoolDown(message: Message, command: Command | SlashCommand, client: Client) {
  if (!client.holder.cooldowns.has(command.name)) {
    client.holder.cooldowns.set(command.name, new Collection());
  }
  const now = Date.now();
  const timestamps = client.holder.cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 5) * 1000;
  if (!message.member) return false;
  if (timestamps.has(message.member.id)) {
    const expirationTime = timestamps.get(message.member.id) + cooldownAmount;
    if (now < expirationTime) {
      return (expirationTime - now) / 1000;
    } else {
      timestamps.set(message.member.id, now);
      // @ts-ignore
      setTimeout(() => timestamps.delete(message.member.id), cooldownAmount);
      return false;
    }
  } else {
    timestamps.set(message.member.id, now);
    // @ts-ignore
    setTimeout(() => timestamps.delete(message.member.id), cooldownAmount);
    return false;
  }
}

export function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}

export function fastEmbed(color: ColorResolvable, title: string, desc: string) {
  return (
    new EmbedBuilder()
      // @ts-ignore
      .setColor(`${color}`)
      .setTitle(title)
      .setDescription(desc)
  );
}

export function fullEmbed(embedData: APIEmbed) {
  return new EmbedBuilder(embedData).setTimestamp().setFooter({ text: "I Love You💜" });
}

export function fastButtons(...buttonData: APIButtonComponent[]) {
  return buttonData.map((button) => {
    return new ButtonBuilder(button);
  });
}

export function fastChannelSelect(selectMenuData: APIChannelSelectComponent) {
  return new ChannelSelectMenuBuilder(selectMenuData);
}

export function fastUserSelect(selectMenuData: APIUserSelectComponent) {
  return new UserSelectMenuBuilder(selectMenuData);
}

export function fastRoleSelect(selectMenuData: APIRoleSelectComponent) {
  return new RoleSelectMenuBuilder(selectMenuData);
}

export function fastStringSelect(selectMenuData: APIStringSelectComponent) {
  return new StringSelectMenuBuilder(selectMenuData);
}

export function fastStringOptions(...optionData: SelectMenuComponentOptionData[]) {
  return optionData.map((option) => {
    return new StringSelectMenuOptionBuilder(option);
  });
}

export function fastRow(components: MessageActionRowComponentBuilder[]) {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(components);
}

export function reVar(str: string, ...args: any[]) {
  if (args.length) {
    for (const arg of args) {
      str = str.replace(/%{VAR}%/, arg);
    }
  }
  return str;
}

export function permissionCommand(
  client: Client,
  message: any,
  lang: string,
  command: Command | SlashCommand,
) {
  if (command.permissions) {
    if (command.permissions.bot) {
      let arr = [];
      for (const permission of command.permissions.bot) {
        if (!message.guild.members.me.permissions.has(permission)) {
          arr.push(permission);
        }
      }
      if (arr.length) {
        message.reply({
          embeds: [
            client.holder.embed.error(
              lang,
              t(
                client,
                lang,
                "functions.permission_check.commands.bot_permission",
                command.name,
                arr.map((p) => `${translatePermission(client, lang, p)}`).join(", "),
              ),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return false;
      } else {
        return true;
      }
    }
    if (command.permissions.user) {
      if (!message.member.permissions.has(command.permissions.user)) {
        message.reply({
          embeds: [
            client.holder.embed.error(
              lang,
              t(
                client,
                lang,
                "functions.permission_check.commands.user_permission",
                command.name,
                translatePermission(client, lang, command.permissions.user),
              ),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return false;
      } else {
        return true;
      }
    }
  }
  return true;
}

export function permissionComponent(
  client: Client,
  interaction: any,
  lang: string,
  component: Component,
) {
  if (component.permissions) {
    if (component.permissions.bot) {
      let arr = [];
      for (const permission of component.permissions.bot) {
        if (!interaction.guild.members.me.permissions.has(permission)) {
          arr.push(permission);
        }
      }
      if (arr.length) {
        interaction.reply({
          embeds: [
            client.holder.embed.error(
              lang,
              t(
                client,
                lang,
                "functions.permission_check.components.bot_permission",
                arr.map((p) => `${translatePermission(client, lang, p)}`).join(", "),
              ),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return false;
      } else {
        return true;
      }
    }
    if (component.permissions.user) {
      if (!interaction.member.permissions.has(component.permissions.user)) {
        interaction.reply({
          embeds: [
            client.holder.embed.error(
              lang,
              t(
                client,
                lang,
                "functions.permission_check.component.user_permission",
                translatePermission(client, lang, component.permissions.user),
              ),
            ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return false;
      } else {
        return true;
      }
    }
  }
  return true;
}

export async function extendedPermissionCommand(
  guild: Guild,
  interaction: any,
  lang: string,
  cmd_name: string,
) {
  let perm = await guild.get(`permissions.commands.${cmd_name}`);

  if (perm) {
    if (perm.roles.length || perm.permission) {
      if (perm.roles.length) {
        let tempArr = [];

        for (const role of perm.roles) {
          if (interaction.member.roles.cache.has(role.id)) {
            tempArr.push(role);
          }
        }

        if (tempArr.length) {
          if (tempArr.some((r) => r.type === "allow")) {
            return true;
          } else {
            interaction.reply({
              embeds: [
                guild.client.holder.embed.error(
                  lang,
                  t(
                    guild.client,
                    lang,
                    "functions.permission_check.commands.extended_permission.role.denied",
                    tempArr
                      .filter((r) => r.type === "deny")
                      .map((r) => `<@&${r.id}>`)
                      .join(" "),
                  ),
                ),
              ],
              flags: MessageFlags.Ephemeral,
            });
            return false;
          }
        } else {
          interaction.reply({
            embeds: [
              guild.client.holder.embed.error(
                lang,
                t(
                  guild.client,
                  lang,
                  "functions.permission_check.commands.extended_permission.role.any_role",
                  perm.roles
                    .filter((r: { id: string; type: string }) => r.type === "allow")
                    .map((r: { id: string; type: string }) => `<@&${r.id}>`)
                    .join(" "),
                ),
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          return false;
        }
      }
      if (perm.permission) {
        if (!interaction.member.permissions.has(perm.permission)) {
          interaction.reply({
            embeds: [
              guild.client.holder.embed.error(
                lang,
                t(
                  guild.client,
                  lang,
                  "functions.permission_check.commands.user_permission",
                  cmd_name,
                  translatePermission(guild.client, lang, perm.permissions),
                ),
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          return false;
        }
      }
    } else {
      return true;
    }
  }
  return true;
}

export function translatePermission(client: Client, lang: string, permission: bigint): string {
  let str = "administrator";

  switch (permission) {
    case PermissionsBitField.Flags.AddReactions:
      str = "add_reactions";
      break;
    case PermissionsBitField.Flags.Administrator:
      str = "administrator";
      break;
    case PermissionsBitField.Flags.AttachFiles:
      str = "attach_files";
      break;
    case PermissionsBitField.Flags.BanMembers:
      str = "ban_members";
      break;
    case PermissionsBitField.Flags.ChangeNickname:
      str = "change_nickname";
      break;
    case PermissionsBitField.Flags.Connect:
      str = "connect";
      break;
    case PermissionsBitField.Flags.CreateInstantInvite:
      str = "create_instant_invite";
      break;
    case PermissionsBitField.Flags.DeafenMembers:
      str = "deafen_members";
      break;
    case PermissionsBitField.Flags.EmbedLinks:
      str = "embed_links";
      break;
    case PermissionsBitField.Flags.KickMembers:
      str = "kick_members";
      break;
    case PermissionsBitField.Flags.ManageChannels:
      str = "manage_channels";
      break;
    case PermissionsBitField.Flags.ManageEmojisAndStickers:
      str = "manage_emojis_and_stickers";
      break;
    case PermissionsBitField.Flags.ManageGuild:
      str = "manage_guild";
      break;
    case PermissionsBitField.Flags.ManageMessages:
      str = "manage_messages";
      break;
    case PermissionsBitField.Flags.ManageNicknames:
      str = "manage_nicknames";
      break;
    case PermissionsBitField.Flags.ManageRoles:
      str = "manage_roles";
      break;
    case PermissionsBitField.Flags.ManageWebhooks:
      str = "manage_webhooks";
      break;
    case PermissionsBitField.Flags.MentionEveryone:
      str = "mention_everyone";
      break;
    case PermissionsBitField.Flags.MoveMembers:
      str = "move_members";
      break;
    case PermissionsBitField.Flags.MuteMembers:
      str = "mute_members";
      break;
    case PermissionsBitField.Flags.PrioritySpeaker:
      str = "priority_speaker";
      break;
    case PermissionsBitField.Flags.ReadMessageHistory:
      str = "read_message_history";
      break;
    case PermissionsBitField.Flags.SendMessages:
      str = "send_messages";
      break;
    case PermissionsBitField.Flags.SendTTSMessages:
      str = "send_tts_messages";
      break;
    case PermissionsBitField.Flags.Speak:
      str = "speak";
      break;
    case PermissionsBitField.Flags.Stream:
      str = "stream";
      break;
    case PermissionsBitField.Flags.UseExternalEmojis:
      str = "use_external_emojis";
      break;
    case PermissionsBitField.Flags.ViewAuditLog:
      str = "view_audit_log";
      break;
    case PermissionsBitField.Flags.ViewChannel:
      str = "view_channel";
      break;
    case PermissionsBitField.Flags.ViewGuildInsights:
      str = "view_guild_insights";
      break;
    case PermissionsBitField.Flags.ManageThreads:
      str = "manage_threads";
      break;
    case PermissionsBitField.Flags.UseExternalStickers:
      str = "use_external_stickers";
      break;
    case PermissionsBitField.Flags.SendMessagesInThreads:
      str = "send_messages_in_threads";
      break;
    case PermissionsBitField.Flags.RequestToSpeak:
      str = "request_to_speak";
      break;
    case PermissionsBitField.Flags.ModerateMembers:
      str = "moderate_members";
      break;
    case PermissionsBitField.Flags.UseApplicationCommands:
      str = "use_application_commands";
      break;
    case PermissionsBitField.Flags.ManageEvents:
      str = "manage_events";
      break;
    case PermissionsBitField.Flags.UseEmbeddedActivities:
      str = "use_embedded_activities";
      break;
    default:
      return "Unknown Permission";
  }

  return t(client, lang, `permissions.${str}` as any);
}

export function generateID(id?: string, type?: string) {
  return id && type
    ? `CI_${type}_${id}_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`
    : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

type TimeUnits = GetSchemaValueType<TranslationSchema, "time_units">;
type TimeUnitKey = keyof TimeUnits;
type TimeUnit = TimeUnits[TimeUnitKey];

function getSlavicTimeForm(value: number, unit: TimeUnit) {
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return unit.forms.more_than_10_less_then_15;
  }

  if (lastDigit === 1) {
    return unit.forms.singular;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return unit.forms.more_than_1_less_then_5;
  }

  if (lastDigit >= 5 && lastDigit <= 9) {
    return unit.forms.more_than_5_less_then_10;
  }

  return unit.forms.plural;
}

function getTimeUnitSuffix(value: number, unit: TimeUnit, locale: string, short: boolean) {
  if (short) {
    return unit.short;
  }

  if (locale === "ru" || locale === "uk") {
    return getSlavicTimeForm(value, unit);
  }

  return value === 1 ? unit.forms.singular : unit.forms.plural;
}

function formatTimeValue(value: number, unit: TimeUnit, locale: string, short: boolean) {
  return `${value}${getTimeUnitSuffix(value, unit, locale, short)}`;
}

export function formatTime(ms: number, locale: string, units: TimeUnits, opts?: { full?: boolean; short?: boolean }): string {
  const options = {
    full: false,
    short: false,
    ...opts,
  }
  const safeMs = Number.isFinite(ms) ? Math.max(0, ms) : 0;

  const days = Math.floor(safeMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((safeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((safeMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((safeMs % (60 * 1000)) / 1000);

  if (!options.full) {
    if (days > 0) return formatTimeValue(days, units.day, locale, options.short);
    if (hours > 0) return formatTimeValue(hours, units.hour, locale, options.short);
    if (minutes > 0) return formatTimeValue(minutes, units.minute, locale, options.short);
    return formatTimeValue(seconds, units.second, locale, options.short);
  }

  const parts: string[] = [];
  if (days > 0) parts.push(formatTimeValue(days, units.day, locale, options.short));
  if (hours > 0) parts.push(formatTimeValue(hours, units.hour, locale, options.short));
  if (minutes > 0) parts.push(formatTimeValue(minutes, units.minute, locale, options.short));
  if (seconds > 0) parts.push(formatTimeValue(seconds, units.second, locale, options.short));

  return parts.join(" ") || formatTimeValue(0, units.second, locale, options.short);
}

export function getNextLevelXP(level: number): number {
  return 5 * level ** 2 + 50 * level + 100;
}

export function isHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

export function userLevelIgnoreCheck(
  user: GuildMember,
  levelS: Levels,
  currentChannelId: string,
): boolean {
  if (levelS.ignore_roles.length) {
    for (const roleId of levelS.ignore_roles) {
      if (user.roles.cache.has(roleId)) {
        return true;
      }
    }
  }
  if (levelS.ignore_channels.length) {
    if (levelS.ignore_channels.includes(currentChannelId)) {
      return true;
    }
  }
  return false;
}

export function awardLevelRole(member: GuildMember, levelS: Levels, currentLevel: number) {
  if (levelS.level_roles) {
    let roleId = "";
    let number = 0;
    for (const roleLevel of Object.keys(levelS.level_roles)) {
      if (currentLevel >= parseInt(roleLevel)) {
        roleId = levelS.level_roles[Number(roleLevel)];
        number = parseInt(roleLevel);
      }
    }
    if (roleId && !member.roles.cache.has(roleId)) {
      member.roles.add(roleId).catch(() => {});
    }
    if (number > 0) {
      for (const roleLevel in Object.keys(levelS.level_roles)) {
        const rId = levelS.level_roles[roleLevel];
        const n = parseInt(roleLevel);
        if (n < number && member.roles.cache.has(rId)) {
          member.roles.remove(rId).catch(() => {});
        }
      }
    }
  }
}
