import { Manifest, SlashCommand } from "../types/helpers";
import { Client, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { lstatSync, readdirSync } from "fs";
import path from "path";

function groupCommandLoad(manifest: Manifest, dir: string) {
    let command = new SlashCommandBuilder()
        .setName(`${manifest.name}`)
        .setDescription(`${manifest.description}`)
    if (manifest.locale) {
        command.setDescriptionLocalizations(manifest.locale)
    }
    if (manifest.permissions) {
        command.setDefaultMemberPermissions(manifest.permissions.user);
    }
    if (manifest.context) {
        command.setContexts(...manifest.context);
    }

    readdirSync(`${process.cwd()}/dist/slash/${dir}/`).forEach((file) => {
        if (file.endsWith('.js') && !lstatSync(`${process.cwd()}/dist/slash/${dir}/${file}`).isDirectory() && file !== 'manifest.js') {
            const pull = require(`${process.cwd()}/dist/slash/${dir}/${file}`) as SlashCommand;

            if (!pull.name || !pull.description) {
                console.log(`Error loading ${dir}/${file}`.bgRed);
                return;
            }

            manifest.commands[pull.name] = pull;

            command.addSubcommand((sub) => {
                sub.setName(pull.name)
                    .setDescription(pull.description)
                if (pull.locale) {
                    sub.setDescriptionLocalizations(pull.locale)
                }

                optionsLoad(pull, sub, dir);

                return sub;
            })
        }
    });

    return { command, manifest };
}

function commandLoad(pull: SlashCommand, dir: string) {
    let slashCommand = new SlashCommandBuilder()
        .setName(pull.name)
        .setDescription(pull.description)
    if (pull.locale) {
        slashCommand.setDescriptionLocalizations(pull.locale)
    }
    if (pull.permissions?.user) {
        slashCommand.setDefaultMemberPermissions(pull.permissions.user)
    }
    if (pull.context) {
        slashCommand.setContexts(...pull.context)
    }

    optionsLoad(pull, slashCommand, dir);

    return { slashCommand };
}

function optionsLoad(pull: SlashCommand, slashCommand: SlashCommandBuilder | SlashCommandSubcommandBuilder, dir: string) {
    for (const option of pull.options) {
        const data = option;

        switch (data.type) {
            case 'STRING':
                slashCommand.addStringOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local));
                break;
            case 'INTEGER':
                slashCommand.addIntegerOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local).setMinValue(data.min).setMaxValue(data.max));
                break;
            case 'BOOLEAN':
                slashCommand.addBooleanOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local));
                break;
            case 'USER':
                slashCommand.addUserOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local));
                break;
            case 'MEMBER':
                slashCommand.addUserOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local));
                break;
            case 'CHANNEL':
                slashCommand.addChannelOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local));
                break;
            case 'ROLE':
                slashCommand.addRoleOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local));
                break;
            case 'NUMBER':
                slashCommand.addNumberOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local).setMinValue(data.min).setMaxValue(data.max));
                break;
            case 'STRING_CHOICE':
                slashCommand.addStringOption(opt => opt.setName(data.name).setDescription(data.description).setRequired(data.required).setDescriptionLocalizations(data.local).addChoices(data.choices));
                break;
            default:
                console.log(`Error loading ${dir}`.bgRed);
                break;
        }
    }
}

export function commandLoader(client: Client) {
    return {
        load(commands: any[]) {
            readdirSync(path.resolve(__dirname, "./../slash")).forEach((dir) => {
                if (lstatSync(path.resolve(__dirname, `./../slash/${dir}`)).isDirectory()) {
                    const man = require(path.resolve(__dirname, `./../slash/${dir}/manifest.js`)) as { manifest: Manifest };

                    if (!man.manifest) {
                        console.log(`Error loading manifest in ${dir}`.bgRed);
                        return;
                    }

                    const { command, manifest } = groupCommandLoad(man.manifest, dir);

                    client.holder.cmds.slashCommands.set(`${manifest.name}`, manifest);
                    commands.push(command.toJSON());
                } else {
                    const pull = require(path.resolve(__dirname, `./../slash/${dir}`)) as SlashCommand;

                    if (!pull.name || !pull.description) {
                        console.log(`Error loading ${dir}`.bgRed);
                        return;
                    }

                    const { slashCommand } = commandLoad(pull, dir);

                    commands.push(slashCommand.toJSON());
                    client.holder.cmds.slashCommands.set(`${pull.name}`, pull);
                }
            });
            return commands;
        },
        reload(relativePath: string, cmdFile: string) {
            const fullPath = path.resolve(relativePath, cmdFile);
            delete require.cache[require.resolve(fullPath)];

            if (lstatSync(relativePath).isDirectory()) {
                const pull = require(`${relativePath}/manifest.js`) as { manifest: Manifest };

                const { command, manifest } = groupCommandLoad(pull.manifest, path.basename(relativePath));

                client.holder.cmds.slashCommands.set(`${manifest.name}`, manifest);
            } else {
                const pull = require(`${relativePath}/${cmdFile}`) as SlashCommand;

                client.holder.cmds.slashCommands.set(`${pull.name}`, pull);
            }
            return true;
        }
    }
}