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
  /** Persistent game state (stored in the `games` column). */
  games: {
    tiles: any;
  };
  presets: {
    jtc: JTCPreset[];
  };
}

export interface UserCache {
  temp: {
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
    icons_padding: 10,
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
  icons_padding: number;
}

export interface BalanceCardDisplayOptions extends DisplayOptions {
  number: string;
}

export interface LevelCardDisplayOptions extends DisplayOptions {}

/**
 * A permission overwrite stored inside a Join To Create preset.
 * `allow` / `deny` are permission bitfields serialised with `BigInt#toString()`
 * so the whole preset stays JSON-safe.
 */
export interface JTCPresetOverwrite {
  id: string;
  type: "role" | "member";
  allow: string;
  deny: string;
}

/**
 * Saved Join To Create channel settings (stored in `User.jtcPresets`, max 5 per user and guild).
 * `channel.rtcRegion` is `null` for "automatic".
 */
export interface JTCPreset {
  id: string;
  name: string;
  description: string | null;
  channel: {
    name: string;
    userLimit: number;
    bitrate: number;
    rtcRegion: string | null;
    overwrites: JTCPresetOverwrite[];
  };
}

export type UserSchemaKey = SchemaKey<UserSchema>;
export type LiteralUserSchemaKey = LiteralSchemaKey<UserSchema>;
export type UserCacheKey = SchemaKey<UserCache>;
export type LiteralUserCacheKey = LiteralSchemaKey<UserCache>;
