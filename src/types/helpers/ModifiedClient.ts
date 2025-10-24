import { Client, Collection, ColorResolvable } from "discord.js";
import { Command, Manifest, SlashCommand } from "./Command";
import Enmap from "enmap";
import { Autocomplete, Button, Modal, SelectMenu } from "./Components";
import { Language } from "../../helpers";

export interface ModifiedClient {
  client: Client;
  holder: Holder;
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
    buttons: Collection<any, Button>;
    modals: Collection<any, Modal>;
    selectMenus: Collection<any, SelectMenu>;
    autocompletes: Collection<any, Autocomplete>;
  };
  languages: {
    [key: string]: Language;
  };
  embed: {
    error: Function;
    info: Function;
    success: Function;
    fast: Function;
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
  };
}
