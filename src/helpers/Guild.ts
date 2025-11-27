import {
  GuildCacheKey,
  GuildSchema,
  GuildSchemaKey,
  LiteralGuildSchemaKey,
  GetSchemaValueType,
  GuildCache,
} from "../types/helpers";
import { Client, Guild as DiscordGuild, User as DiscordUser } from "discord.js";
import { DBHistory, DBGuild } from "../database";
import { GuildPathMap } from "../database/mappings/GuildMapping";
import { Cache, User } from "./";

/**
 * Guild helper class - wrapper around DBGuild with backward compatibility
 *
 * WARNING: This class provides async methods. Make sure to use await when calling get/set/etc.
 * The old synchronous API is deprecated.
 */
export class Guild {
  public client: Client;
  public guild: DiscordGuild;
  public history: DBHistory;
  public cache: Cache<GuildCache, GuildCacheKey>;
  private db: DBGuild;

  constructor(client: Client, guild: DiscordGuild) {
    this.client = client;
    this.guild = guild;
    this.db = new DBGuild(client, guild);
    this.history = this.db.history;
    this.cache = new Cache("guild_temp", guild.id, GuildPathMap);
  }

  /**
   * Get value by path (ASYNC - must use await)
   * Supports both literal paths (with precise type inference) and dynamic paths
   */
  public async get<K extends LiteralGuildSchemaKey>(
    path: K,
  ): Promise<GetSchemaValueType<GuildSchema, K>>;
  public async get(path: string): Promise<any>;
  public async get(path: string): Promise<any> {
    return await this.db.get(path as any);
  }

  /**
   * Set value by path (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async set<K extends LiteralGuildSchemaKey>(
    path: K,
    value: GetSchemaValueType<GuildSchema, K>,
  ): Promise<void>;
  public async set(path: string, value: any): Promise<void>;
  public async set(path: string, value: any): Promise<void> {
    return await this.db.set(path as any, value);
  }

  /**
   * Add to numeric value (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async add<K extends LiteralGuildSchemaKey>(
    path: K,
    value: GetSchemaValueType<GuildSchema, K> extends number ? number : never,
  ): Promise<void>;
  public async add(path: string, value: number): Promise<void>;
  public async add(path: string, value: number): Promise<void> {
    return await this.db.add(path, value);
  }

  /**
   * Subtract from numeric value (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async sub<K extends LiteralGuildSchemaKey>(
    path: K,
    value: GetSchemaValueType<GuildSchema, K> extends number ? number : never,
  ): Promise<void>;
  public async sub(path: string, value: number): Promise<void>;
  public async sub(path: string, value: number): Promise<void> {
    return await this.db.sub(path, value);
  }

  /**
   * Push to array (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async push<K extends LiteralGuildSchemaKey>(
    path: K,
    value: GetSchemaValueType<GuildSchema, K> extends Array<infer T> ? T : never,
  ): Promise<void>;
  public async push(path: string, value: any): Promise<void>;
  public async push(path: string, value: any): Promise<void> {
    return await this.db.push(path, value);
  }

  /**
   * Delete field (ASYNC - must use await)
   */
  public async delete(path: GuildSchemaKey): Promise<void> {
    return await this.db.delete(path);
  }

  /**
   * Check if path exists (ASYNC - must use await)
   */
  public async has(path: string): Promise<boolean> {
    return await this.db.has(path);
  }

  /**
   * Get all guild data (ASYNC - must use await)
   */
  public async all(): Promise<any> {
    return await this.db.all();
  }

  /**
   * Get user instance
   */
  public getUser(id: string): User {
    if (!this.guild.members.cache.get(id)?.user) {
      throw Error(`Member with ID ${id} not found in guild ${this.guild.name}.`);
    }
    return new User(this.client, this.guild.members.cache.get(id)?.user as DiscordUser, this.guild);
  }
}
