import { JTCPreset, UserSchema } from '../types/helpers';
import { Client, Guild, User as DiscordUser } from "discord.js";
import { DBHistory } from "../database/DBHistory";
import { DBUser } from "../database/DBUser";

/**
 * User helper class - wrapper around DBUser with backward compatibility
 *
 * WARNING: This class provides async methods. Make sure to use await when calling get/set/etc.
 * The old synchronous API is deprecated.
 */
export class User {
    public user: DiscordUser;
    public guild: Guild;
    public client: Client;
    public history: DBHistory;
    private db: DBUser;

    constructor(client: Client, user: DiscordUser, guild: Guild) {
        this.client = client;
        this.user = user;
        this.guild = guild;
        this.db = new DBUser(client, user, guild);
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
     * Get all user data (ASYNC - must use await)
     */
    public async all(): Promise<any> {
        return await this.db.all();
    }
}
