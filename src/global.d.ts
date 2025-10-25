import { Collection, ColorResolvable } from "discord.js";
import { Command, Manifest, Autocomplete, Button, Modal, SelectMenu } from "./types/helpers";
import { I18nManager } from "./i18n/I18n";
import { PrismaClient } from "@prisma/client";
import { EmojisKey } from "./emoji/emojis";

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
  db: PrismaClient;
  components: {
    buttons: Collection<any, Button>;
    modals: Collection<any, Modal>;
    selectMenus: Collection<any, SelectMenu>;
    autocompletes: Collection<any, Autocomplete>;
  };
  i18n: I18nManager;
  embed: {
    error: (lang: string, desc: string) => any;
    info: (lang: string, desc: string) => any;
    success: (lang: string, desc: string) => any;
    fast: (color: ColorResolvable, title: string, desc: string) => any;
  };
  utils: {
    reVar: Function;
    fastEmbed: Function;
  };
  colors: {
    default: ColorResolvable;
    error: ColorResolvable;
    success: ColorResolvable;
    info: ColorResolvable;
  };
  emojis: {
    [key in EmojisKey]: string;
  };
}
