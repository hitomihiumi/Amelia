import { Guild as PrismaGuild } from "@prisma/client";
import { Guild as DiscordGuild } from "discord.js";
import { prisma } from "./prisma";
import { Client } from "discord.js";
import { DBUser } from "./DBUser";
import { DBHistory } from "./DBHistory";
import { GuildPathMap, GuildFieldMap } from "./mappings/GuildMapping";
import { TempCache } from "./TempCache";

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
  | "utils.components.selectMenus"
  | "utils.components.scenarios"
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
 * Default values for MongoDB-stored fields (components)
 */
const MONGODB_DEFAULTS = {
  components: {
    modals: [],
    embed: [],
    buttons: [],
    selectMenus: [],
    scenarios: [],
  },
};

/**
 * Database Guild wrapper with type-safe access
 * Automatically routes utils.components fields to MongoDB for better performance
 */
export class DBGuild {
  public client: Client;
  public guild: DiscordGuild;
  public history: DBHistory;
  private data: PrismaGuild | null = null;
  private mongoCache: TempCache<typeof GuildPathMap>;

  constructor(client: Client, guild: DiscordGuild) {
    this.client = client;
    this.guild = guild;
    this.history = new DBHistory(client, guild);
    // Use persistent MongoDB collection for guild components data
    this.mongoCache = new TempCache("guild_data", guild.id, GuildPathMap);
  }

  /**
   * Check if a path should be stored in MongoDB (components)
   */
  private isMongoDBPath(path: string): boolean {
    return path.startsWith("utils.components");
  }

  /**
   * Initialize MongoDB data with defaults for components
   */
  private async ensureMongoDBData(path: string): Promise<void> {
    if (!path.startsWith("utils.components")) return;

    const hasComponents = await this.mongoCache.has("utils.components.modals");
    if (!hasComponents) {
      // Initialize all component fields
      await this.mongoCache.set("utils.components.modals", MONGODB_DEFAULTS.components.modals);
      await this.mongoCache.set("utils.components.embed", MONGODB_DEFAULTS.components.embed);
      await this.mongoCache.set("utils.components.buttons", MONGODB_DEFAULTS.components.buttons);
      await this.mongoCache.set(
        "utils.components.selectMenus",
        MONGODB_DEFAULTS.components.selectMenus,
      );
      await this.mongoCache.set(
        "utils.components.scenarios",
        MONGODB_DEFAULTS.components.scenarios,
      );
    }
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
   * Automatically routes utils.components to MongoDB for better performance
   */
  public async get<T extends GuildPath>(path: T): Promise<PathValue<T>> {
    // Route to MongoDB for components paths
    if (this.isMongoDBPath(path)) {
      await this.ensureMongoDBData(path);

      // Check if this is the parent path "utils.components"
      if (path === "utils.components") {
        const result: any = {
          modals: (await this.mongoCache.get("utils.components.modals")) || [],
          embed: (await this.mongoCache.get("utils.components.embed")) || [],
          buttons: (await this.mongoCache.get("utils.components.buttons")) || [],
          selectMenus: (await this.mongoCache.get("utils.components.selectMenus")) || [],
          scenarios: (await this.mongoCache.get("utils.components.scenarios")) || [],
        };
        return result as PathValue<T>;
      }

      // Leaf path: get single value from MongoDB
      const value = await this.mongoCache.get(path);
      return (value ?? []) as PathValue<T>;
    }

    // PostgreSQL path
    await this.ensureGuild();

    const data = await prisma.guild.findUnique({
      where: { id: this.guild.id },
    });

    if (!data) return null as any;

    // Check if this is a parent path (has children)
    const pathInfo = GuildPathMap[path];

    if (pathInfo && pathInfo.children) {
      // This is a parent path, recursively collect all child values
      const result = this.collectChildValues(path, pathInfo.children, data);
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
   * Automatically routes utils.components to MongoDB for better performance
   */
  public async set<T extends GuildPath>(path: T, value: PathValue<T>): Promise<void> {
    // Route to MongoDB for components paths
    if (this.isMongoDBPath(path)) {
      await this.ensureMongoDBData(path);

      // Check if this is the parent path "utils.components"
      if (path === "utils.components" && typeof value === "object" && value !== null) {
        const components = value as any;
        if (components.modals !== undefined) {
          await this.mongoCache.set("utils.components.modals", components.modals);
        }
        if (components.embed !== undefined) {
          await this.mongoCache.set("utils.components.embed", components.embed);
        }
        if (components.buttons !== undefined) {
          await this.mongoCache.set("utils.components.buttons", components.buttons);
        }
        if (components.selectMenus !== undefined) {
          await this.mongoCache.set("utils.components.selectMenus", components.selectMenus);
        }
        if (components.scenarios !== undefined) {
          await this.mongoCache.set("utils.components.scenarios", components.scenarios);
        }
        return;
      }

      await this.mongoCache.set(path, value);
      return;
    }

    // PostgreSQL path
    await this.ensureGuild();

    // Check if this is a parent path (has children)
    const pathInfo = GuildPathMap[path];

    if (pathInfo && pathInfo.children && pathInfo.children.length > 0) {
      // This is a parent path, set all child values recursively
      await this.setChildValues(path, pathInfo.children, value);
      this.data = null;
      return;
    }

    const keys = path.split(".");
    let field: string | undefined;
    let remainingKeys: string[] = [];

    // First check if this path has a direct field mapping
    const directField = GuildFieldMap[path];
    if (directField) {
      field = directField;
    } else {
      // Path not found, might be dynamic path in JSON field
      // Try to find the closest parent path with a field
      for (let i = keys.length - 1; i > 0; i--) {
        const parentPath = keys.slice(0, i).join(".");
        const parentField = GuildFieldMap[parentPath];
        if (parentField) {
          field = parentField;
          remainingKeys = keys.slice(i);
          break;
        }
      }

      if (!field) {
        throw new Error(
          `Unknown guild path: ${path}. Please regenerate mappings with 'npm run generate:schema'`,
        );
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
    // Route to MongoDB for components paths
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
   */
  public async delete(path: string): Promise<void> {
    // Route to MongoDB for components paths
    if (this.isMongoDBPath(path)) {
      await this.mongoCache.delete(path);
      return;
    }

    await this.set(path as any, null as any);
  }

  /**
   * Check if path exists
   */
  public async has(path: string): Promise<boolean> {
    // Route to MongoDB for components paths
    if (this.isMongoDBPath(path)) {
      return await this.mongoCache.has(path);
    }

    const value = await this.get(path as any);
    return value !== null && value !== undefined;
  }

  /**
   * Get all guild data (PostgreSQL + MongoDB components)
   */
  public async all(): Promise<PrismaGuild & { components?: any }> {
    const pgData = await this.ensureGuild();

    // Get components from MongoDB
    const components = await this.get("utils.components" as any);

    return {
      ...pgData,
      components,
    };
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
   * Recursively collect child values for a parent path
   */
  private collectChildValues(parentPath: string, children: string[], data: any): any {
    const result: any = {};

    for (const childKey of children) {
      const childPath = `${parentPath}.${childKey}`;
      const childInfo = GuildPathMap[childPath];

      if (!childInfo) continue;

      if (childInfo.children && childInfo.children.length > 0) {
        // This child is also a parent, recurse
        result[childKey] = this.collectChildValues(childPath, childInfo.children, data);
      } else if (childInfo.field) {
        // This is a leaf node with a direct field mapping
        result[childKey] = data[childInfo.field as keyof typeof data];
      }
    }

    return result;
  }

  /**
   * Recursively set child values for a parent path
   */
  private async setChildValues(parentPath: string, children: string[], value: any): Promise<void> {
    if (!value || typeof value !== "object") return;

    const updateData: Record<string, any> = {};

    // Collect all field updates
    this.collectFieldUpdates(parentPath, children, value, updateData);

    // Perform single update with all fields
    if (Object.keys(updateData).length > 0) {
      await prisma.guild.update({
        where: { id: this.guild.id },
        data: updateData,
      });
    }
  }

  /**
   * Recursively collect field updates from nested value object
   */
  private collectFieldUpdates(
    parentPath: string,
    children: string[],
    value: any,
    updateData: Record<string, any>,
  ): void {
    for (const childKey of children) {
      const childPath = `${parentPath}.${childKey}`;
      const childInfo = GuildPathMap[childPath];
      const childValue = value[childKey];

      if (childValue === undefined) continue;

      if (!childInfo) continue;

      if (childInfo.children && childInfo.children.length > 0) {
        // This child is also a parent, recurse
        this.collectFieldUpdates(childPath, childInfo.children, childValue, updateData);
      } else if (childInfo.field) {
        // This is a leaf node with a direct field mapping
        updateData[childInfo.field] = childValue;
      }
    }
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
