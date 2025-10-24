import fs from "fs";
import path from "path";
import { Guild, Language } from "../helpers";
import { Command, Component, ModifiedClient, SlashCommand } from "../types/helpers";
import {
    Collection,
    Message,
    EmbedBuilder,
    PermissionsBitField,
    ColorResolvable
} from "discord.js";

export function foldersCheck() {
    let folders = [
        {
           name: "dbs",
           path: "./../../"
        }, {
            name: "guilds",
            path: "./../../dbs/"
        }, {
            name: "users",
            path: "./../../dbs/"
        }, {
            name: "history",
            path: "./../../dbs/"
        }, {
            name: "commands",
            path: "../"
        }, {
            name: "components",
            path: "../"
        }, {
            name: "button",
            path: "../components"
        }, {
            name: "modals",
            path: "../components"
        }, {
            name: "selectMenus",
            path: "../components"
        }, {
            name: "autocompletes",
            path: "../components"
        }, {
            name: "events",
            path: "../"
        }, {
            name: "client",
            path: "../events"
        }, {
            name: "guild",
            path: "../events"
        }, {
            name: "locale",
            path: "./../../"
        }
    ];

    folders.forEach(folder => {
        if (!fs.existsSync(path.resolve(__dirname, folder.path, folder.name))) {
            fs.mkdirSync(path.resolve(__dirname, folder.path, folder.name));
        }
    });
}

export async function localeUpdate(client: ModifiedClient) {
    let locale = path.resolve(__dirname, "./../../locale/");

    fs.readdirSync(locale).forEach(file => {
        let name = file.endsWith('.json') ? file.slice(0, -5) : file;
        let lang = require(path.resolve(locale, file));
        client.holder.languages[name] = new Language(lang);
    });
}

export async function localeFetch() {
    await fetch("https://raw.githubusercontent.com/hitomihiumi/language-holder/master/languages.json").then(async (res: { json: () => any; }) => {
        let langs = await res.json();

        langs.forEach((lang: any) => {
            fs.writeFileSync(path.resolve(__dirname, "./../../locale/" + lang.code + ".json"), JSON.stringify(lang), { encoding: 'utf8' });
        });
    })
}

export function onCoolDown(message: Message, command: Command | SlashCommand, client: ModifiedClient) {
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
            const timeLeft = (expirationTime - now) / 1000;
            return timeLeft
        }
        else {
            timestamps.set(message.member.id, now);
            // @ts-ignore
            setTimeout(() => timestamps.delete(message.member.id), cooldownAmount);
            return false;
        }
    }
    else {
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
    return new EmbedBuilder()
        // @ts-ignore
        .setColor(`${color}`)
        .setTitle(title)
        .setDescription(desc);
}

export function reVar(str: string, ...args: any[]) {
    if (args.length) {
        for (const arg of args) {
            str = str.replace(/%{VAR}%/, arg);
        }
    }
    return str;
}

export function permissionCommand(client: ModifiedClient, message: any, lang: string, command: Command | SlashCommand) {
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
                    embeds: [client.holder.embed.error(client, lang, client.holder.languages[`${lang}`].getText('functions.permission_check.commands.bot_permission', command.name, arr.map(p => `${translatePermission(client, lang, p)}`)))],
                    ephemeral: true
                });
                return false;
            } else {
                return true;
            }
        }
        if (command.permissions.user) {
            if (!message.member.permissions.has(command.permissions.user)) {
                message.reply({
                    embeds: [client.holder.embed.error(client, lang, client.holder.languages[`${lang}`].getText('functions.permission_check.commands.user_permission', command.name, translatePermission(client, lang, command.permissions.user)))],
                    ephemeral: true
                });
                return false;
            } else {
                return true;
            }
        }
    }
    return true;
}

export function permissionComponent(client: ModifiedClient, interaction: any, lang: string, component: Component) {
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
                    embeds: [client.holder.embed.error(client, lang, client.holder.languages[`${lang}`].getText('functions.permission_check.components.bot_permission', arr.map(p => `${translatePermission(client, lang, p)}`)))],
                    ephemeral: true
                });
                return false;
            } else {
                return true;
            }
        }
        if (component.permissions.user) {
            if (!interaction.member.permissions.has(component.permissions.user)) {
                interaction.reply({
                    embeds: [client.holder.embed.error(client, lang, client.holder.languages[`${lang}`].getText('functions.permission_check.component.user_permission', translatePermission(client, lang, component.permissions.user)))],
                    ephemeral: true
                });
                return false;
            } else {
                return true;
            }
        }
    }
    return true;
}

export function extendedPermissionCommand(guild: Guild, interaction: any, lang: string, cmd_name: string) {
    let perm = guild.get(`permissions.commands.${cmd_name}`);

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
                    if (tempArr.some(r => r.type === "allow")) {
                        return true;
                    } else {
                        interaction.reply({
                            embeds: [guild.client.holder.embed.error(guild.client, lang, guild.client.holder.languages[`${lang}`].getText('functions.permission_check.commands.extended_permission.role.denied', tempArr.filter(r => r.type === "deny").map(r => `<@&${r.id}> `)))],
                            ephemeral: true
                        });
                        return false;
                    }
                } else {
                    interaction.reply({
                        embeds: [guild.client.holder.embed.error(guild.client, lang, guild.client.holder.languages[`${lang}`].getText('functions.permission_check.commands.extended_permission.role.any_role', perm.roles.filter((r: { id: string, type: string }) => r.type === "allow").map((r: { id: string, type: string }) => `<@&${r.id}> `)))],
                        ephemeral: true
                    });
                    return false;
                }
            }
            if (perm.permission) {
                if (!interaction.member.permissions.has(perm.permission)) {
                    interaction.reply({
                        embeds: [guild.client.holder.embed.error(guild.client, lang, guild.client.holder.languages[`${lang}`].getText('functions.permission_check.commands.user_permission', cmd_name, translatePermission(guild.client, lang, perm.permissions)))],
                        ephemeral: true
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


export function translatePermission(client: ModifiedClient, lang: string, permission: bigint) {
    let str = "";
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
            str = "manage_emojis";
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
        case PermissionsBitField.Flags.CreatePublicThreads:
            str = "start_public_threads";
            break;
        case PermissionsBitField.Flags.CreatePrivateThreads:
            str = "start_private_threads";
            break;
        case PermissionsBitField.Flags.RequestToSpeak:
            str = "request_to_speak";
            break;
        default:
            str = "unknown";
            break;
    }
    return client.holder.languages[`${lang}`].getText(`permissions.${str}`);
}

export function generateID(id?: string, type?: string) {
    return (id && type) ? `CI_${type}_${id}_${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatTime(ms: number, opts?: {
    locale?: string;
    full?: boolean;
    short?: boolean;
}) {

    const { locale = 'ru', full = false, short = false } = opts || {};

    const timeUnits = {
        ru: {
            day: {
                short: 'д',
                forms: [' день', ' дня', ' дней']
            },
            hour: {
                short: 'ч',
                forms: [' час', ' часа', ' часов']
            },
            minute: {
                short: 'м',
                forms: [' минута', ' минуты', ' минут']
            },
            second: {
                short: 'с',
                forms: [' секунда', ' секунды', ' секунд']
            }
            },
        en: {
            day: {
                short: 'd',
                forms: [' day', ' days', ' days']
            },
            hour: {
                short: 'h',
                forms: [' hour', ' hours', ' hours']
            },
            minute: {
                short: 'm',
                forms: [' minute', ' minutes', ' minutes']
            },
            second: {
                short: 's',
                forms: [' second', ' seconds', ' seconds']
            }
        }
    };

    //@ts-ignore
    const units = timeUnits[locale] || timeUnits.ru;

    const getRussianForm = (num: number, forms: string[]) => {
        const lastDigit = num % 10;
        const lastTwoDigits = num % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return forms[2];
        if (lastDigit === 1) return forms[0];
        if (lastDigit >= 2 && lastDigit <= 4) return forms[1];
        return forms[2];
    };

    const getForm = (num: number, unit: { short: string, forms: string[] }) => {
        if (short) return unit.short;
        if (locale === 'ru') return getRussianForm(num, unit.forms);
        return num === 1 ? unit.forms[0] : unit.forms[1];
    };

    const formatValue = (value: number, unit: { short: string, forms: string[] }) => {
        return value + getForm(value, unit);
    };

    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);

    if (!full) {
        if (days > 0) return formatValue(days, units.day);
        if (hours > 0) return formatValue(hours, units.hour);
        if (minutes > 0) return formatValue(minutes, units.minute);
        return formatValue(seconds, units.second);
    }

    const parts: string[] = [];
    if (days > 0) parts.push(formatValue(days, units.day));
    if (hours > 0) parts.push(formatValue(hours, units.hour));
    if (minutes > 0) parts.push(formatValue(minutes, units.minute));
    if (seconds > 0) parts.push(formatValue(seconds, units.second));

    return parts.join(' ') || formatValue(0, units.second);
}