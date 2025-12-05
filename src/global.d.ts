import {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  Collection,
  ColorResolvable,
  EmbedBuilder,
  APIButtonComponent,
  ButtonBuilder,
  APIChannelSelectComponent,
  APIUserSelectComponent,
  APIRoleSelectComponent,
  APIStringSelectComponent,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { Command, Manifest, Autocomplete, Button, Modal, SelectMenu } from "./types/helpers";
import { I18nManager } from "./i18n/I18n";
import { PrismaClient } from "@prisma/client";
import { EmojisKey } from "./emoji/emojis";
import { APIEmbed } from "discord-api-types/v10";
import { TranslationSchema } from "./types/i18n/TranslationSchema";

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
    reVar: (str: string, ...args: any[]) => string;
    fastEmbed: (embedData: APIEmbed) => EmbedBuilder;
    fastButtons: (...buttonData: APIButtonComponent[]) => ButtonBuilder[];
    fastStringSelect: (selectMenuData: APIStringSelectComponent) => StringSelectMenuBuilder;
    fastRoleSelect: (selectMenuData: APIRoleSelectComponent) => RoleSelectMenuBuilder;
    fastUserSelect: (selectMenuData: APIUserSelectComponent) => UserSelectMenuBuilder;
    fastChannelSelect: (selectMenuData: APIChannelSelectComponent) => ChannelSelectMenuBuilder;
    fastStringOptions: (
      ...optionData: SelectMenuComponentOptionData[]
    ) => StringSelectMenuOptionBuilder[];
    fastRow: (
      components: MessageActionRowComponentBuilder[],
    ) => ActionRowBuilder<MessageActionRowComponentBuilder>;
  };
  colors: {
    default: ColorResolvable;
    error: ColorResolvable;
    success: ColorResolvable;
    info: ColorResolvable;
  };
  emojis: {
    ids: {
      [key in EmojisKey]: string;
    };
    discord: {
      [key in EmojisKey]: string;
    };
  };
  assets: {
    profileIcons: Record<keyof TranslationSchema["icons"], string>;
  };
}
