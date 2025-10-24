import { GuildSchema } from "../types/helpers";
import { Client, Guild as DiscordGuild, User as DiscordUser } from "discord.js";
import { DBHistory } from "../database/DBHistory";
import { DBUser } from "../database/DBUser";
import { DBGuild } from "../database/DBGuild";

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
  private db: DBGuild;

  constructor(client: Client, guild: DiscordGuild) {
    this.client = client;
    this.guild = guild;
    this.db = new DBGuild(client, guild);
    this.history = this.db.history;
  }

  /**
   * Get value by path (ASYNC - must use await)
   */
  public async get(path: string): Promise<any> {
    return await this.db.get(path as any);
  }

  /**
   * Set value by path (ASYNC - must use await)
   */
  public async set(path: string, value: any): Promise<void> {
    return await this.db.set(path as any, value);
  }

  /**
   * Add to numeric value (ASYNC - must use await)
   */
  public async add(path: string, value: any): Promise<void> {
    return await this.db.add(path, value);
  }

  /**
   * Subtract from numeric value (ASYNC - must use await)
   */
  public async sub(path: string, value: any): Promise<void> {
    return await this.db.sub(path, value);
  }

  /**
   * Push to array (ASYNC - must use await)
   */
  public async push(path: string, value: any): Promise<void> {
    return await this.db.push(path, value);
  }

  /**
   * Delete field (ASYNC - must use await)
   */
  public async delete(path: string): Promise<void> {
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

// Re-export User from the same file to maintain compatibility
import { User } from "./User";
