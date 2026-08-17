import { EmojiResolvable } from "discord.js";
import {
  EmbedCustom,
  ModalCustom,
  IModalField,
  ButtonCustom,
  SelectMenuCustom,
  ScenarioCustom,
} from "./";
import { SchemaKey, LiteralSchemaKey } from "./SchemaKeys";
import { ModerationForm, Punishment, WarnThreshold } from "./ModerationSchema";

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
      select_placeholder: string | null;
      embed: {
        title: string | null;
        description: string | null;
        color: string | null;
        thumbnail: string | null;
        image: string | null;
        footer: string | null;
      };
      games: FindTeamGame[];
    };
    components: {
      modals: Array<ModalCustom>;
      embed: Array<EmbedCustom>;
      buttons: Array<ButtonCustom>;
      selectMenus: Array<SelectMenuCustom>;
      scenarios: Array<ScenarioCustom>;
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
    log_channel: string | null;
    dm_notify: boolean;
    /** Days after which a warn stops counting towards escalation. `0` disables expiry. */
    warn_expiry: number;
    warn_thresholds: WarnThreshold[];
    forms: {
      report: ModerationForm;
      appeal: ModerationForm;
    };
    auto_moderation: {
      invite: {
        enabled: boolean;
        ignore_channels: string[];
        ignore_roles: string[];
        delete_message: boolean;
        moderation_immune: boolean;
        punishment: Punishment;
      };
      links: {
        enabled: boolean;
        ignore_channels: string[];
        ignore_roles: string[];
        ignore_links: string[];
        delete_message: boolean;
        moderation_immune: boolean;
        punishment: Punishment;
      };
    };
  };
  permissions: {
    commands: {
      [key: string]: CommandPermission;
    };
  };
}

export interface GuildCache {
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

export interface CommandPermission {
  name: string;
  roles: Array<{ id: string; type: "deny" | "allow" }>;
  permission: bigint | null;
}

interface ShopRole {
  role: string;
  price: number;
  discount: {
    amount: number;
    starts_at: number | null;
    expires_at: number | null;
  };
}

interface CounterChannel {
  type: string;
  channel: string;
  name: string;
}

interface FindTeamGame {
  id: string;
  name: string;
  emoji: EmojiResolvable;
  role: string | null;
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
    [key: number]: string;
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
export type LiteralGuildSchemaKey = LiteralSchemaKey<GuildSchema>;
export type GuildCacheKey = SchemaKey<GuildCache>;
export type LiteralGuildCacheKey = LiteralSchemaKey<GuildCache>;
export type { FindTeamGame };
