import {
  UserCacheKey,
  UserSchemaKey,
  LiteralUserSchemaKey,
  UserSchema,
  GetSchemaValueType,
  UserCache,
} from "../types/helpers";
import { Client, Guild, User as DiscordUser, GuildMember } from "discord.js";
import { DBUser, DBHistory } from "../database";
import { UserPathMap } from "../database/mappings/UserMapping";
import { Cache } from "./";

/**
 * User helper class - wrapper around DBUser with backward compatibility
 *
 * WARNING: This class provides async methods. Make sure to use await when calling get/set/etc.
 * The old synchronous API is deprecated.
 */
export class User {
  public user: DiscordUser;
  public member: GuildMember;
  public guild: Guild;
  public client: Client;
  public history: DBHistory;
  public cache: Cache<UserCache, UserCacheKey>;
  private db: DBUser;

  constructor(client: Client, user: DiscordUser, guild: Guild) {
    this.client = client;
    this.user = user;
    this.member = guild.members.cache.get(user.id) as GuildMember;
    this.guild = guild;
    this.db = new DBUser(client, user, guild);
    this.history = this.db.history;
    this.cache = new Cache("user_temp", `${user.id}:${guild.id}`, UserPathMap);
  }

  /**
   * Get value by path (ASYNC - must use await)
   * Supports both literal paths (with precise type inference) and dynamic paths
   */
  public async get<K extends LiteralUserSchemaKey>(
    path: K,
  ): Promise<GetSchemaValueType<UserSchema, K>>;
  public async get(path: string): Promise<any>;
  public async get(path: string): Promise<any> {
    return await this.db.get(path as any);
  }

  /**
   * Set value by path (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async set<K extends LiteralUserSchemaKey>(
    path: K,
    value: GetSchemaValueType<UserSchema, K>,
  ): Promise<void>;
  public async set(path: string, value: any): Promise<void>;
  public async set(path: string, value: any): Promise<void> {
    return await this.db.set(path as any, value);
  }

  /**
   * Add to numeric value (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async add<K extends LiteralUserSchemaKey>(
    path: K,
    value: GetSchemaValueType<UserSchema, K> extends number ? number : never,
  ): Promise<void>;
  public async add(path: string, value: number): Promise<void>;
  public async add(path: string, value: number): Promise<void> {
    return await this.db.add(path, value);
  }

  /**
   * Subtract from numeric value (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async sub<K extends LiteralUserSchemaKey>(
    path: K,
    value: GetSchemaValueType<UserSchema, K> extends number ? number : never,
  ): Promise<void>;
  public async sub(path: string, value: number): Promise<void>;
  public async sub(path: string, value: number): Promise<void> {
    return await this.db.sub(path, value);
  }

  /**
   * Push to array (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async push<K extends LiteralUserSchemaKey>(
    path: K,
    value: GetSchemaValueType<UserSchema, K> extends Array<infer T> ? T : never,
  ): Promise<void>;
  public async push(path: string, value: any): Promise<void>;
  public async push(path: string, value: any): Promise<void> {
    return await this.db.push(path, value);
  }

  /**
   * Delete field (ASYNC - must use await)
   */
  public async delete(path: UserSchemaKey): Promise<void> {
    return await this.db.delete(path);
  }

  /**
   * Check if path exists (ASYNC - must use await)
   */
  public async has(path: UserSchemaKey): Promise<boolean> {
    return await this.db.has(path);
  }

  /**
   * Get all user data (ASYNC - must use await)
   */
  public async all(): Promise<any> {
    return await this.db.all();
  }
}
