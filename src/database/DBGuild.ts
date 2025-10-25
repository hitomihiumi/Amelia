import { Guild as PrismaGuild } from "@prisma/client";
import { Guild as DiscordGuild } from "discord.js";
import { prisma } from "./prisma";
import { Client } from "discord.js";
import { DBUser } from "./DBUser";
import { DBHistory } from "./DBHistory";

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
   */
  public async get<T extends GuildPath>(path: T): Promise<PathValue<T>> {
    await this.ensureGuild();

    // Handle temp data (in-memory cache)
    if (path === "temp.join_to_create.map") {
      return this.jtcChannelCache as any;
    }

    const keys = path.split(".");
    const field = this.mapPathToField(keys);

    const data = await prisma.guild.findUnique({
      where: { id: this.guild.id },
      select: { [field]: true },
    });

    if (!data) return null as any;

    // Determine how many keys were consumed by the field mapping
    const fieldPath = Object.entries({
      "settings.prefix": "prefix",
      "settings.language": "language",
      "utils.join_to_create.enabled": "jtcEnabled",
      "utils.join_to_create.channel": "jtcChannel",
      "utils.join_to_create.category": "jtcCategory",
      "utils.join_to_create.default_name": "jtcDefaultName",
      "utils.counter.enabled": "counterEnabled",
      "utils.counter.category": "counterCategory",
      "utils.counter.channels": "counterChannels",
      "utils.levels.enabled": "levelsEnabled",
      "utils.levels.ignore_channels": "levelsIgnoreChannels",
      "utils.levels.ignore_roles": "levelsIgnoreRoles",
      "utils.levels.level_roles": "levelsRoles",
      "utils.components.modals": "customModals",
      "utils.components.embed": "customEmbeds",
      "utils.components.buttons": "customButtons",
      "economy.currency.emoji": "currencyEmoji",
      "economy.currency.id": "currencyId",
      "moderation.moderation_roles": "moderationRoles",
      "permissions.commands": "commandPermissions",
    }).find(([_, v]) => v === field)?.[0];

    let remainingKeys: string[] = [];
    if (fieldPath) {
      const fieldKeys = fieldPath.split(".");
      remainingKeys = keys.slice(fieldKeys.length);
    }

    return this.extractValue(data[field as keyof typeof data], remainingKeys) as PathValue<T>;
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
    const field = this.mapPathToField(keys);

    // Determine how many keys were consumed by the field mapping
    const mapping: Record<string, string> = {
      "settings.prefix": "prefix",
      "settings.language": "language",
      "utils.join_to_create.enabled": "jtcEnabled",
      "utils.join_to_create.channel": "jtcChannel",
      "utils.join_to_create.category": "jtcCategory",
      "utils.join_to_create.default_name": "jtcDefaultName",
      "utils.counter.enabled": "counterEnabled",
      "utils.counter.category": "counterCategory",
      "utils.counter.channels": "counterChannels",
      "utils.levels.enabled": "levelsEnabled",
      "utils.levels.ignore_channels": "levelsIgnoreChannels",
      "utils.levels.ignore_roles": "levelsIgnoreRoles",
      "utils.levels.level_roles": "levelsRoles",
      "utils.components.modals": "customModals",
      "utils.components.embed": "customEmbeds",
      "utils.components.buttons": "customButtons",
      "economy.currency.emoji": "currencyEmoji",
      "economy.currency.id": "currencyId",
      "moderation.moderation_roles": "moderationRoles",
      "permissions.commands": "commandPermissions",
    };

    const fieldPath = Object.entries(mapping).find(([_, v]) => v === field)?.[0];
    let remainingKeys: string[] = [];
    if (fieldPath) {
      const fieldKeys = fieldPath.split(".");
      remainingKeys = keys.slice(fieldKeys.length);
    }

    // For JSON fields with nested paths, we need to update the whole field
    if (remainingKeys.length > 0) {
      // Get current data
      const currentData = await prisma.guild.findUnique({
        where: { id: this.guild.id },
        select: { [field]: true },
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
   * Map dot-notation path to Prisma field
   */
  private mapPathToField(keys: string[]): string {
    const mapping: Record<string, string> = {
      "settings.prefix": "prefix",
      "settings.language": "language",
      "utils.join_to_create.enabled": "jtcEnabled",
      "utils.join_to_create.channel": "jtcChannel",
      "utils.join_to_create.category": "jtcCategory",
      "utils.join_to_create.default_name": "jtcDefaultName",
      "utils.counter.enabled": "counterEnabled",
      "utils.counter.category": "counterCategory",
      "utils.counter.channels": "counterChannels",
      "utils.levels.enabled": "levelsEnabled",
      "utils.levels.ignore_channels": "levelsIgnoreChannels",
      "utils.levels.ignore_roles": "levelsIgnoreRoles",
      "utils.levels.level_roles": "levelsRoles",
      "utils.components.modals": "customModals",
      "utils.components.embed": "customEmbeds",
      "utils.components.buttons": "customButtons",
      "economy.currency.emoji": "currencyEmoji",
      "economy.currency.id": "currencyId",
      "moderation.moderation_roles": "moderationRoles",
      "permissions.commands": "commandPermissions",
    };

    const fullPath = keys.join(".");

    // Check exact match first
    if (mapping[fullPath]) {
      return mapping[fullPath];
    }

    // Check if path starts with a mapped prefix (for dynamic paths like permissions.commands.commandName)
    for (const [mapKey, mapValue] of Object.entries(mapping)) {
      if (fullPath.startsWith(mapKey + ".") || fullPath === mapKey) {
        return mapValue;
      }
    }

    return keys[0];
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
