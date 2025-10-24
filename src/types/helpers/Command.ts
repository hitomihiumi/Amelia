import { ModifiedClient } from "./ModifiedClient";
import * as _options from "./Options";
import { ChatInputCommandInteraction, Message, InteractionContextType } from "discord.js";
import { LocalizationMap } from 'discord-api-types/v10';

export interface Command {
    name: string;
    category: string;
    aliases: string[];
    cooldown: number;
    description: string;
    permissions?: {
        user?: bigint;
        bot: bigint[];
    };
    allowedUsers: string[];
    minArgs?: number;
    maxArgs?: number;
    run: (client: ModifiedClient, message: Message, args: string[]) => void;
};

export interface SlashCommand {
    name: string;
    description: string;
    cooldown: number;
    permissions: {
        user?: bigint;
        bot: bigint[];
    };
    locale?: LocalizationMap;
    options: Array<_options.IntegerOption |
        _options.StringChoiceOption |
        _options.MemberOption |
        _options.StringOption |
        _options.ChannelOption |
        _options.NumberOption |
        _options.BooleanOption |
        _options.RoleOption |
        _options.UserOption>;
    context?: InteractionContextType[];
    run: (client: ModifiedClient, interaction: ChatInputCommandInteraction) => void;
}

export interface Manifest {
    name: string;
    description: string;
    locale?: LocalizationMap;
    permissions: {
        user?: bigint;
    };
    commands: {
        [key: string]: SlashCommand;
    };
    context: InteractionContextType[];
}
