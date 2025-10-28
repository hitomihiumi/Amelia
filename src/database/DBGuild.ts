import { Guild as PrismaGuild } from "@prisma/client";
import { Guild as DiscordGuild } from "discord.js";
import { prisma } from "./prisma";
import { Client } from "discord.js";
import { DBUser } from "./DBUser";
import { DBHistory } from "./DBHistory";
import { GuildPathMap, GuildFieldMap } from "./mappings/GuildMapping";

/**
 * Type-safe paths for Guild data access
 */
type GuildPath =
  | "settings.prefix"
  | "settings.language"
  | "utils.join_to_create.enabled"
  | "utils.join_to_create.channel"
  | "utils.join_to_create.category"
  | "utils.join_to_create.default_name"
  | "utils.counter.enabled"
  | "utils.counter.category"
  | "utils.counter.channels"
  | "utils.levels.enabled"
  | "utils.levels.ignore_channels"
  | "utils.levels.ignore_roles"
  | "utils.levels.level_roles"
  | "utils.components.modals"
  | "utils.components.embed"
  | "utils.components.buttons"
  | "economy.currency.emoji"
  | "economy.currency.id"
  | "moderation.moderation_roles"
  | "permissions.commands"
  | string; // Allow any string for flexibility

/**
 * Type inference for Guild paths
 */
type PathValue<T extends GuildPath> = T extends "settings.prefix"
  ? string
  : T extends "settings.language"
    ? string
    : T extends "utils.join_to_create.enabled"
      ? boolean
      : T extends "utils.join_to_create.channel"
        ? string | null
        : T extends "utils.join_to_create.category"
          ? string | null
          : T extends "utils.join_to_create.default_name"
            ? string
            : T extends "utils.counter.enabled"
              ? boolean
              : T extends "utils.counter.channels"
                ? any
                : T extends "utils.levels.enabled"
                  ? boolean
                  : T extends "utils.levels.ignore_channels"
                    ? string[]
                    : T extends "utils.levels.ignore_roles"
                      ? string[]
                      : T extends "utils.components.modals"
                        ? any[]
                        : T extends "moderation.moderation_roles"
                          ? string[]
                          : T extends "permissions.commands"
                            ? any
                            : any;

/**
 * Database Guild wrapper with type-safe access
 */
export class DBGuild {
  public client: Client;
  public guild: DiscordGuild;
  public history: DBHistory;
  private data: PrismaGuild | null = null;
  private jtcChannelCache: Map<string, { channel: string; owner: string }> = new Map();

  constructor(client: Client, guild: DiscordGuild) {
    this.client = client;
    this.guild = guild;
    this.history = new DBHistory(client, guild);
  }

  /**
   * Initialize and ensure guild exists in database
   */
  private async ensureGuild(): Promise<PrismaGuild> {
    if (this.data) return this.data;

    this.data = await prisma.guild.upsert({
      where: { id: this.guild.id },
      update: {},
      create: {
        id: this.guild.id,
      },
    });

    return this.data;
  }

  /**
   * Get value by path with type inference
   * Supports parent paths (e.g., "utils.join_to_create" returns all JTC fields)
   */
  public async get<T extends GuildPath>(path: T): Promise<PathValue<T>> {
    await this.ensureGuild();

    // Handle temp data (in-memory cache)
    if (path === "temp.join_to_create.map") {
      return this.jtcChannelCache as any;
    }

    const data = await prisma.guild.findUnique({
      where: { id: this.guild.id },
    });

    if (!data) return null as any;

    // Check if this is a parent path (has children)
    const pathInfo = GuildPathMap[path];

    if (pathInfo && pathInfo.children) {
      // This is a parent path, collect all child values
      const result: any = {};

      for (const childKey of pathInfo.children) {
        const childPath = `${path}.${childKey}`;
        const childInfo = GuildPathMap[childPath];

        if (childInfo && childInfo.field) {
          result[childKey] = data[childInfo.field as keyof typeof data];
        }
      }

      return result as PathValue<T>;
    }

    // This is a leaf path or dynamic path
    const keys = path.split(".");

    // Try to get mapped field
    let field: string;
    let remainingKeys: string[] = [];

    try {
      field = this.mapPathToField(path);
    } catch (error) {
      // Path not found, might be dynamic path in JSON field
      // Try to find the closest parent path
      for (let i = keys.length - 1; i > 0; i--) {
        const parentPath = keys.slice(0, i).join(".");
        try {
          field = this.mapPathToField(parentPath);
          remainingKeys = keys.slice(i);
          break;
        } catch {
          // Try next parent
        }
      }

      if (!field!) {
        throw error;
      }
    }

    const fieldValue = data[field as keyof typeof data];

    // If we have remaining keys, extract nested value from JSON field
    if (remainingKeys.length > 0) {
      return this.extractValue(fieldValue, remainingKeys) as PathValue<T>;
    }

    return fieldValue as PathValue<T>;
  }

  /**
   * Set value by path with type safety
   */
  public async set<T extends GuildPath>(path: T, value: PathValue<T>): Promise<void> {
    await this.ensureGuild();

    // Handle temp data (in-memory cache)
    if (path === "temp.join_to_create.map") {
      this.jtcChannelCache = value as any;
      return;
    }

    const keys = path.split(".");
    let field: string;
    let remainingKeys: string[] = [];

    try {
      field = this.mapPathToField(path);
    } catch (error) {
      // Path not found, might be dynamic path in JSON field
      // Try to find the closest parent path
      for (let i = keys.length - 1; i > 0; i--) {
        const parentPath = keys.slice(0, i).join(".");
        try {
          field = this.mapPathToField(parentPath);
          remainingKeys = keys.slice(i);
          break;
        } catch {
          // Try next parent
        }
      }

      if (!field!) {
        throw error;
      }
    }

    // For JSON fields with nested paths, we need to update the whole field
    if (remainingKeys.length > 0) {
      // Get current data
      const currentData = await prisma.guild.findUnique({
        where: { id: this.guild.id },
      });

      const currentValue = (currentData?.[field as keyof typeof currentData] || {}) as any;
      const updatedValue = this.setNestedValue(currentValue, remainingKeys, value);

      await prisma.guild.update({
        where: { id: this.guild.id },
        data: { [field]: updatedValue },
      });
    } else {
      // Direct field update
      await prisma.guild.update({
        where: { id: this.guild.id },
        data: { [field]: value },
      });
    }

    // Invalidate cache
    this.data = null;
  }

  /**
   * Set nested value in object (immutable)
   */
  private setNestedValue(obj: any, keys: string[], value: any): any {
    if (keys.length === 0) return value;

    const result = typeof obj === "object" && obj !== null ? { ...obj } : {};
    const [currentKey, ...restKeys] = keys;

    if (restKeys.length === 0) {
      result[currentKey] = value;
    } else {
      result[currentKey] = this.setNestedValue(result[currentKey], restKeys, value);
    }

    return result;
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
   * Get all guild data
   */
  public async all(): Promise<PrismaGuild> {
    return await this.ensureGuild();
  }

  /**
   * Get user instance
   */
  public getUser(userId: string): DBUser {
    const member = this.guild.members.cache.get(userId);
    if (!member?.user) {
      throw new Error(`Member with ID ${userId} not found in guild ${this.guild.name}.`);
    }
    return new DBUser(this.client, member.user, this.guild);
  }

  /**
   * Map dot-notation path to Prisma field using auto-generated mapping
   */
  private mapPathToField(path: string): string {
    const field = GuildFieldMap[path];

    if (!field) {
      throw new Error(
        `Unknown guild path: ${path}. Please regenerate mappings with 'npm run generate:schema'`,
      );
    }

    return field;
  }

  /**
   * Extract nested value from object
   */
  private extractValue(obj: any, keys: string[]): any {
    if (keys.length === 0 || !obj) return obj;

    // For JSON fields
    if (typeof obj === "object" && keys.length > 0) {
      return keys.reduce((acc, key) => acc?.[key], obj);
    }

    return obj;
  }
}
