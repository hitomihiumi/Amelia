import { User as PrismaUser } from "@prisma/client";
import { User as DiscordUser, Guild, Client } from "discord.js";
import { prisma } from "./prisma";
import { DBHistory } from "./DBHistory";
import { UserPathMap, UserFieldMap } from "./mappings/UserMapping";

/**
 * Type-safe paths for User data access
 */
type UserPath =
  | "level"
  | "level.xp"
  | "level.total_xp"
  | "level.level"
  | "level.voice_time"
  | "level.message_count"
  | "economy.balance"
  | "economy.balance.wallet"
  | "economy.balance.bank"
  | "economy.timeout.work"
  | "economy.timeout.daily"
  | "economy.timeout.weekly"
  | "economy.timeout.rob"
  | "custom.balance"
  | "custom.balance.number"
  | "custom.balance.mode"
  | "custom.profile"
  | "custom.profile.bio"
  | "custom.rank"
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
   * Supports parent paths (e.g., "level" returns all level fields)
   */
  public async get<T extends UserPath>(path: T): Promise<UserPathValue<T>> {
    await this.ensureUser();

    // Fetch all data once
    const data = await prisma.user.findUnique({
      where: {
        userId_guildId: {
          userId: this.user.id,
          guildId: this.guild.id,
        },
      },
    });

    if (!data) return null as any;

    // Check if this is a parent path (has children)
    const pathInfo = UserPathMap[path];

    if (pathInfo && pathInfo.children) {
      // This is a parent path, collect all child values
      const result: any = {};

      for (const childKey of pathInfo.children) {
        const childPath = `${path}.${childKey}`;
        const childInfo = UserPathMap[childPath];

        if (childInfo && childInfo.field) {
          result[childKey] = data[childInfo.field as keyof typeof data];
        }
      }

      return result as UserPathValue<T>;
    }

    // This is a leaf path, get the single field value
    const field = this.mapPathToField(path);
    return data[field as keyof typeof data] as UserPathValue<T>;
  }

  /**
   * Set value by path with type safety
   */
  public async set<T extends UserPath>(path: T, value: UserPathValue<T>): Promise<void> {
    await this.ensureUser();

    const field = this.mapPathToField(path);

    await prisma.user.update({
      where: {
        userId_guildId: {
          userId: this.user.id,
          guildId: this.guild.id,
        },
      },
      data: { [field]: value },
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
   * Map dot-notation path to Prisma field using auto-generated mapping
   */
  private mapPathToField(path: string): string {
    const field = UserFieldMap[path];

    if (!field) {
      throw new Error(
        `Unknown user path: ${path}. Please regenerate mappings with 'npm run generate:schema'`
      );
    }

    return field;
  }
}
