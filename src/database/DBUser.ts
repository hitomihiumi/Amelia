import { User as PrismaUser } from "@prisma/client";
import { User as DiscordUser, Guild, Client } from "discord.js";
import { prisma } from "../database/prisma";
import { DBHistory } from "./DBHistory";

/**
 * Type-safe paths for User data access
 */
type UserPath =
  | "level.xp"
  | "level.total_xp"
  | "level.level"
  | "level.voice_time"
  | "level.message_count"
  | "economy.balance.wallet"
  | "economy.balance.bank"
  | "economy.timeout.work"
  | "economy.timeout.daily"
  | "economy.timeout.weekly"
  | "economy.timeout.rob"
  | "custom.balance.number"
  | "custom.balance.mode"
  | "custom.profile.bio"
  | "custom.badges"
  | "presets.jtc"
  | string;

/**
 * Type inference for User paths
 */
type UserPathValue<T extends UserPath> = T extends "level.xp"
  ? number
  : T extends "level.total_xp"
    ? number
    : T extends "level.level"
      ? number
      : T extends "economy.balance.wallet"
        ? number
        : T extends "economy.balance.bank"
          ? number
          : T extends "economy.timeout.work"
            ? number
            : T extends "custom.balance.number"
              ? string
              : T extends "custom.balance.mode"
                ? boolean
                : T extends "custom.profile.bio"
                  ? string
                  : T extends "custom.badges"
                    ? any[]
                    : T extends "presets.jtc"
                      ? any[]
                      : any;

/**
 * Database User wrapper with type-safe access
 */
export class DBUser {
  public user: DiscordUser;
  public guild: Guild;
  public client: Client;
  public history: DBHistory;
  private data: PrismaUser | null = null;

  constructor(client: Client, user: DiscordUser, guild: Guild) {
    this.client = client;
    this.user = user;
    this.guild = guild;
    this.history = new DBHistory(client, guild);
  }

  /**
   * Initialize and ensure user exists in database
   */
  private async ensureUser(): Promise<PrismaUser> {
    if (this.data) return this.data;

    this.data = await prisma.user.upsert({
      where: {
        userId_guildId: {
          userId: this.user.id,
          guildId: this.guild.id,
        },
      },
      update: {},
      create: {
        userId: this.user.id,
        guildId: this.guild.id,
        balanceNumber: `${this.guild.id.slice(0, 5)} ${this.user.id.slice(0, 5)} ${Math.floor(Math.random() * 1000)} ${Math.floor(Math.random() * 1000)}`,
      },
    });

    return this.data;
  }

  /**
   * Get value by path with type inference
   */
  public async get<T extends UserPath>(path: T): Promise<UserPathValue<T>> {
    await this.ensureUser();

    const keys = path.split(".");
    const field = this.mapPathToField(keys);

    const data = await prisma.user.findUnique({
      where: {
        userId_guildId: {
          userId: this.user.id,
          guildId: this.guild.id,
        },
      },
      select: { [field]: true },
    });

    if (!data) return null as any;

    return this.extractValue(data[field as keyof typeof data], keys.slice(1)) as UserPathValue<T>;
  }

  /**
   * Set value by path with type safety
   */
  public async set<T extends UserPath>(path: T, value: UserPathValue<T>): Promise<void> {
    await this.ensureUser();

    const keys = path.split(".");
    const field = this.mapPathToField(keys);
    const updateValue = this.buildUpdateValue(keys.slice(1), value);

    await prisma.user.update({
      where: {
        userId_guildId: {
          userId: this.user.id,
          guildId: this.guild.id,
        },
      },
      data: { [field]: updateValue },
    });

    // Invalidate cache
    this.data = null;
  }

  /**
   * Add to numeric value
   */
  public async add(path: string, value: number): Promise<void> {
    const current = await this.get(path as any);
    await this.set(path as any, (current as number) + value);
  }

  /**
   * Subtract from numeric value
   */
  public async sub(path: string, value: number): Promise<void> {
    const current = await this.get(path as any);
    await this.set(path as any, (current as number) - value);
  }

  /**
   * Push to array
   */
  public async push(path: string, value: any): Promise<void> {
    const current = await this.get(path as any);
    if (Array.isArray(current)) {
      await this.set(path as any, [...current, value]);
    }
  }

  /**
   * Delete field
   */
  public async delete(path: string): Promise<void> {
    await this.set(path as any, null as any);
  }

  /**
   * Check if path exists
   */
  public async has(path: string): Promise<boolean> {
    const value = await this.get(path as any);
    return value !== null && value !== undefined;
  }

  /**
   * Get all user data
   */
  public async all(): Promise<PrismaUser> {
    return await this.ensureUser();
  }

  /**
   * Map dot-notation path to Prisma field
   */
  private mapPathToField(keys: string[]): string {
    const mapping: Record<string, string> = {
      "level.xp": "xp",
      "level.total_xp": "totalXp",
      "level.level": "level",
      "level.voice_time": "voiceTime",
      "level.message_count": "messageCount",
      "economy.balance.wallet": "wallet",
      "economy.balance.bank": "bank",
      "economy.inventory.custom.roles": "customRoles",
      "economy.inventory.custom.items": "customItems",
      "economy.timeout.work": "workTimeout",
      "economy.timeout.timely": "timelyTimeout",
      "economy.timeout.daily": "dailyTimeout",
      "economy.timeout.weekly": "weeklyTimeout",
      "economy.timeout.rob": "robTimeout",
      "custom.balance.number": "balanceNumber",
      "custom.balance.mode": "balanceMode",
      "custom.balance.solid": "balanceSolid",
      "custom.balance.url": "balanceUrl",
      "custom.profile.bio": "profileBio",
      "custom.profile.mode": "profileMode",
      "custom.profile.solid": "profileSolid",
      "custom.profile.url": "profileUrl",
      "custom.profile.color": "profileColor",
      "custom.rank.mode": "rankMode",
      "custom.rank.solid": "rankSolid",
      "custom.rank.url": "rankUrl",
      "custom.rank.color": "rankColor",
      "custom.badges": "customBadges",
      "temp.games": "tempGames",
      "presets.jtc": "jtcPresets",
    };

    const fullPath = keys.join(".");
    return mapping[fullPath] || keys[0];
  }

  /**
   * Extract nested value from object
   */
  private extractValue(obj: any, keys: string[]): any {
    if (keys.length === 0 || !obj) return obj;

    if (typeof obj === "object" && keys.length > 0) {
      return keys.reduce((acc, key) => acc?.[key], obj);
    }

    return obj;
  }

  /**
   * Build update value for nested paths
   */
  private buildUpdateValue(keys: string[], value: any): any {
    if (keys.length === 0) return value;

    if (keys.length === 1 && typeof value !== "object") {
      return value;
    }

    const result: any = {};
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  }
}
