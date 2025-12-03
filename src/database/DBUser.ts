import { User as PrismaUser } from "@prisma/client";
import { User as DiscordUser, Guild, Client } from "discord.js";
import { prisma } from "./prisma";
import { DBHistory } from "./DBHistory";
import { UserPathMap, UserFieldMap } from "./mappings/UserMapping";
import { TempCache } from "./TempCache";

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
  | "economy"
  | "economy.balance"
  | "economy.balance.wallet"
  | "economy.balance.bank"
  | "economy.inventory"
  | "economy.inventory.custom"
  | "economy.inventory.custom.roles"
  | "economy.inventory.custom.items"
  | "economy.timeout"
  | "economy.timeout.work"
  | "economy.timeout.timely"
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
 * Default values for MongoDB-stored fields
 */
const MONGODB_DEFAULTS = {
  level: {
    xp: 0,
    total_xp: 0,
    level: 1,
    voice_time: 0,
    message_count: 0,
  },
  economy: {
    balance: {
      wallet: 0,
      bank: 0,
    },
    inventory: {
      custom: {
        roles: [],
        items: [],
      },
    },
    timeout: {
      work: 0,
      timely: 0,
      daily: 0,
      weekly: 0,
      rob: 0,
    },
  },
};

/**
 * Database User wrapper with type-safe access
 * Automatically routes level and economy fields to MongoDB
 */
export class DBUser {
  public user: DiscordUser;
  public guild: Guild;
  public client: Client;
  public history: DBHistory;
  private data: PrismaUser | null = null;
  private mongoCache: TempCache<typeof UserPathMap>;

  constructor(client: Client, user: DiscordUser, guild: Guild) {
    this.client = client;
    this.user = user;
    this.guild = guild;
    this.history = new DBHistory(client, guild);
    // Use persistent MongoDB collection for user data (not temp)
    this.mongoCache = new TempCache("user_data", `${user.id}:${guild.id}`, UserPathMap);
  }

  /**
   * Check if a path should be stored in MongoDB
   */
  private isMongoDBPath(path: string): boolean {
    return path.startsWith("level") || path.startsWith("economy");
  }

  /**
   * Initialize MongoDB data with defaults
   */
  private async ensureMongoDBData(path: string): Promise<void> {
    const rootPath = path.split(".")[0];

    if (rootPath === "level") {
      const hasLevel = await this.mongoCache.has("level.xp");
      if (!hasLevel) {
        // Initialize all level fields
        for (const [key, value] of Object.entries(MONGODB_DEFAULTS.level)) {
          await this.mongoCache.set(`level.${key}`, value);
        }
      }
    } else if (rootPath === "economy") {
      const hasEconomy = await this.mongoCache.has("economy.balance.wallet");
      if (!hasEconomy) {
        // Initialize all economy fields
        await this.mongoCache.set(
          "economy.balance.wallet",
          MONGODB_DEFAULTS.economy.balance.wallet,
        );
        await this.mongoCache.set("economy.balance.bank", MONGODB_DEFAULTS.economy.balance.bank);
        await this.mongoCache.set(
          "economy.inventory.custom.roles",
          MONGODB_DEFAULTS.economy.inventory.custom.roles,
        );
        await this.mongoCache.set(
          "economy.inventory.custom.items",
          MONGODB_DEFAULTS.economy.inventory.custom.items,
        );
        await this.mongoCache.set("economy.timeout.work", MONGODB_DEFAULTS.economy.timeout.work);
        await this.mongoCache.set(
          "economy.timeout.timely",
          MONGODB_DEFAULTS.economy.timeout.timely,
        );
        await this.mongoCache.set("economy.timeout.daily", MONGODB_DEFAULTS.economy.timeout.daily);
        await this.mongoCache.set(
          "economy.timeout.weekly",
          MONGODB_DEFAULTS.economy.timeout.weekly,
        );
        await this.mongoCache.set("economy.timeout.rob", MONGODB_DEFAULTS.economy.timeout.rob);
      }
    }
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
   * Automatically routes to MongoDB for level and economy fields
   */
  public async get<T extends UserPath>(path: T): Promise<UserPathValue<T>> {
    // Route to MongoDB for level and economy paths
    if (this.isMongoDBPath(path)) {
      await this.ensureMongoDBData(path);

      // Check if this is a parent path
      const pathInfo = UserPathMap[path];

      if (pathInfo && pathInfo.children) {
        // Parent path: collect all child values from MongoDB
        const result: any = {};

        for (const childKey of pathInfo.children) {
          const childPath = `${path}.${childKey}`;
          const value = await this.mongoCache.get(childPath);

          if (value !== null && value !== undefined) {
            result[childKey] = value;
          }
        }

        return result as UserPathValue<T>;
      }

      // Leaf path: get single value from MongoDB
      const value = await this.mongoCache.get(path);
      return (value ?? null) as UserPathValue<T>;
    }

    // PostgreSQL path
    await this.ensureUser();

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
   * Automatically routes to MongoDB for level and economy fields
   */
  public async set<T extends UserPath>(path: T, value: UserPathValue<T>): Promise<void> {
    // Route to MongoDB for level and economy paths
    if (this.isMongoDBPath(path)) {
      await this.ensureMongoDBData(path);
      await this.mongoCache.set(path, value);
      return;
    }

    // PostgreSQL path
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
   * Works with both MongoDB and PostgreSQL paths
   */
  public async add(path: string, value: number): Promise<void> {
    if (this.isMongoDBPath(path)) {
      await this.ensureMongoDBData(path);
      await this.mongoCache.add(path, value);
      return;
    }

    const current = await this.get(path as any);
    await this.set(path as any, (current as number) + value);
  }

  /**
   * Subtract from numeric value
   * Works with both MongoDB and PostgreSQL paths
   */
  public async sub(path: string, value: number): Promise<void> {
    if (this.isMongoDBPath(path)) {
      await this.ensureMongoDBData(path);
      await this.mongoCache.sub(path, value);
      return;
    }

    const current = await this.get(path as any);
    await this.set(path as any, (current as number) - value);
  }

  /**
   * Push to array
   * Works with both MongoDB and PostgreSQL paths
   */
  public async push(path: string, value: any): Promise<void> {
    if (this.isMongoDBPath(path)) {
      await this.ensureMongoDBData(path);
      await this.mongoCache.push(path, value);
      return;
    }

    const current = await this.get(path as any);
    if (Array.isArray(current)) {
      await this.set(path as any, [...current, value]);
    }
  }

  /**
   * Delete field
   * Works with both MongoDB and PostgreSQL paths
   */
  public async delete(path: string): Promise<void> {
    if (this.isMongoDBPath(path)) {
      await this.mongoCache.delete(path);
      return;
    }

    await this.set(path as any, null as any);
  }

  /**
   * Check if path exists
   * Works with both MongoDB and PostgreSQL paths
   */
  public async has(path: string): Promise<boolean> {
    if (this.isMongoDBPath(path)) {
      return await this.mongoCache.has(path);
    }

    const value = await this.get(path as any);
    return value !== null && value !== undefined;
  }

  /**
   * Get all user data (PostgreSQL only)
   * Note: MongoDB data is not included in this method
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
        `Unknown user path: ${path}. Please regenerate mappings with 'npm run generate:schema'`,
      );
    }

    return field;
  }
}
