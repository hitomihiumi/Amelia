import { EmojiResolvable } from "discord.js";
import { EmbedCustom, ModalCustom, IModalField, ButtonCustom } from "./";
import { SchemaKey } from "./SchemaKeys";

export interface GuildSchema {
  id: string;
  settings: {
    prefix: string;
    language: string;
  };
  utils: {
    join_to_create: {
      enabled: boolean;
      channel: string | null;
      category: string | null;
      default_name: string;
    };
    counter: {
      enabled: boolean;
      category: string | null;
      channel: {
        [key: string]: CounterChannel;
      };
    };
    levels: Levels;
    find_team: {
      enabled: boolean;
      channel: string | null;
      send_channel: string | null;
      games: Game[];
    };
    components: {
      modals: Array<ModalCustom>;
      embed: Array<EmbedCustom>;
      buttons: Array<ButtonCustom>;
    };
    giveaways: Giveaway[];
  };
  economy: {
    currency: {
      emoji: string | null;
      id: string | null;
    };
    shop: {
      roles: ShopRole[];
    };
    income: {
      work: {
        enabled: boolean;
        cooldown: number;
        min: number;
        max: number;
      };
      timely: {
        enabled: boolean;
        amount: number;
      };
      daily: {
        enabled: boolean;
        amount: number;
      };
      weekly: {
        enabled: boolean;
        amount: number;
      };
      level_up: {
        enabled: boolean;
        amount: number;
      };
      bump: {
        enabled: boolean;
        amount: number;
      };
      rob: {
        enabled: boolean;
        cooldown: number;
        income: {
          min: number;
          max: number;
          type: "percentage" | "fixed";
        };
        punishment: {
          min: number;
          max: number;
          type: "percentage" | "fixed";
          fail_chance: number;
        };
      };
    };
  };
  moderation: {
    moderation_roles: string[];
    auto_moderation: {
      invite: {
        enabled: boolean;
        ignore_channels: string[];
        ignore_roles: string[];
        delete_message: boolean;
        moderation_immune: boolean;
        punishment: {
          type: PunishmentType;
          time: number;
          reason: string;
        };
      };
      links: {
        enabled: boolean;
        ignore_channels: string[];
        ignore_roles: string[];
        ignore_links: string[];
        delete_message: boolean;
        moderation_immune: boolean;
        punishment: {
          type: PunishmentType;
          time: number;
          reason: string;
        };
      };
    };
  };
  permissions: {
    commands: {
      [key: string]: CommandPermission;
    };
  };
  temp: {
    join_to_create: {
      map: Map<
        string,
        {
          channel: string;
          owner: string;
        }
      >;
    };
  };
}

interface Giveaway {
  id: string;
  winners: number;
  prize: string;
  ends: number;
  channel: string;
}

enum PunishmentType {
  Kick = "kick",
  Ban = "ban",
  Warn = "warn",
  Mute = "mute",
}

export interface CommandPermission {
  name: string;
  roles: Array<{ id: string; type: "deny" | "allow" }>;
  permission: bigint | null;
}

interface ShopRole {
  role: string;
  price: number;
}

interface CounterChannel {
  type: string;
  channel: string;
  name: string;
}

interface LevelRole {
  level: number;
  role: string;
}

interface Game {
  name: string;
  emoji: EmojiResolvable;
  role: string;
  modal: {
    title: string;
    fields: IModalField[];
  };
}

export interface Levels {
  enabled: boolean;
  ignore_channels: string[];
  ignore_roles: string[];
  level_roles: {
    [key: string]: LevelRole;
  };
  message: {
    enabled: boolean;
    channel: string | null;
    content: {
      text: string | null;
      embed: {
        title: string | null;
        description: string | null;
        color: string | null;
        thumbnail: string | null;
        footer: string | null;
      };
    };
    delete: number;
  };
}

export type GuildSchemaKey = SchemaKey<GuildSchema>;
