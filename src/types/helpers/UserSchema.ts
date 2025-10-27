import { PermissionsBitField } from "discord.js";

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
    badges: string[];
  };
  temp: {
    games: {
      tiles: any;
    };
  };
  presets: {
    jtc: JTCPreset[];
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
}

export interface BalanceCardDisplayOptions extends DisplayOptions {
  number: string;
}

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
