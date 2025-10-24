import { Collection, ColorResolvable } from "discord.js";
import { Command, Manifest, SlashCommand } from "./types/helpers/Command";
import Enmap from "enmap";
import { Autocomplete, Button, Modal, SelectMenu } from "./types/helpers/Components";
import { Language } from "./helpers";

declare module "discord.js" {
    export interface Client {
        holder: Holder;
    }
}

export type AnySlash = SlashCommand | Manifest;

export interface Holder {
    cooldowns: Collection<string, any>;
    cmds: {
        commands: Collection<string, Command>;
        slashCommands: Collection<string, AnySlash>;
        aliases: Collection<string, string>;
        cooldowns: Collection<string, any>;
    };
    dbs: {
        guilds: Enmap;
        users: Enmap;
        history: Enmap;
    };
    components: {
        buttons: Collection<any, Button>
        modals: Collection<any, Modal>
        selectMenus: Collection<any, SelectMenu>
        autocompletes: Collection<any, Autocomplete>
    };
    languages: {
        [key: string]: Language
    };
    embed: {
        error: (lang: string, desc: string) => any;
        info: (lang: string, desc: string) => any;
        success: (lang: string, desc: string) => any;
        fast: (color: ColorResolvable, title: string, desc: string) => any;
    };
    utils: {
        reVar: Function;
    };
    colors: {
        default: ColorResolvable;
        error: ColorResolvable;
        success: ColorResolvable;
        info: ColorResolvable;
    };
    emojis: {
        [key: string]: string;
    }
}

