import { PermissionsBitField } from "discord.js";
import { SchemaKey, LiteralSchemaKey } from "./SchemaKeys";
import { TranslationSchema } from "../i18n/TranslationSchema";

export interface UserSchema {
  user_id: string;
  guild_id: string;
  level: Level;
  economy: {
    balance: {
      wallet: number;
      bank: number;
    };
    inventory: {
      custom: {
        roles: string[];
        items: string[];
      };
    };
    timeout: {
      work: number;
      timely: number;
      daily: number;
      weekly: number;
      rob: number;
    };
  };
  custom: {
    balance: BalanceCardDisplayOptions;
    profile: ProfileCardDisplayOptions;
    rank: RankCardDisplayOptions;
    level_up: LevelCardDisplayOptions;
    badges: string[];
  };
  presets: {
    jtc: JTCPreset[];
  };
}

export interface UserCache {
  temp: {
    games: {
      tiles: any;
    };
    voice_time: number;
  };
}

interface DisplayOptions {
  mode: boolean;
  solid: {
    bg_color: string;
    first_component: string;
    second_component: string;
    third_component: string;
  };
  url: string | null;
}

export const defaultDisplayOptions = {
  rank: {
    mode: false,
    solid: {
      bg_color: "#000000",
      first_component: "#ffffff",
      second_component: "#C30F45",
      third_component: "#422242",
    },
    url: null,
  },
  profile: {
    icons_padding: {
      x: 10,
      y: 10,
    },
    mode: false,
    solid: {
      bg_color: "#000000",
      first_component: "#ffffff",
      second_component: "#C30F45",
      third_component: "#422242",
    },
    url: null,
  },
  balance: {
    mode: false,
    solid: {
      bg_color: "#000000",
      first_component: "#ffffff",
      second_component: "#C30F45",
      third_component: "#422242",
    },
    url: null,
  },
  level_up: {
    mode: false,
    solid: {
      bg_color: "#000000",
      first_component: "#ffffff",
      second_component: "#422242",
      third_component: "#C30F45",
    },
    url: null,
  },
};

export type Level = {
  xp: number;
  total_xp: number;
  level: number;
  voice_time: number;
  message_count: number;
};

export interface RankCardDisplayOptions extends DisplayOptions {
  color: string | null;
}

export interface ProfileCardDisplayOptions extends DisplayOptions {
  color: string | null;
  bio: string | null;
  icons: Array<{
    name: keyof TranslationSchema["icons"];
    pos: [number, number];
  }>;
  icons_padding: {
    x: number;
    y: number;
  };
}

export interface BalanceCardDisplayOptions extends DisplayOptions {
  number: string;
}

export interface LevelCardDisplayOptions extends DisplayOptions {}

export interface JTCPreset {
  id: string;
  name: string;
  description: string | null;
  channel: {
    name: string;
    user_limit: number;
    bitrate: number;
    region: string;
    permissions: {
      [key: string]: {
        true: PermissionsBitField[];
        false: PermissionsBitField[];
      };
    };
  };
}

export type UserSchemaKey = SchemaKey<UserSchema>;
export type LiteralUserSchemaKey = LiteralSchemaKey<UserSchema>;
export type UserCacheKey = SchemaKey<UserCache>;
export type LiteralUserCacheKey = LiteralSchemaKey<UserCache>;
