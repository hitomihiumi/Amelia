import type { Redis } from "ioredis";
import { RedisService } from "./redis";
import type { PathMap } from "./mappings/GuildMapping";

/**
 * Hash field that tracks which paths hold Map structures,
 * the counterpart of the former MongoDB `mapPaths` document field.
 */
const MAP_PATHS_FIELD = "__mapPaths__";

/** user_temp keys expire after 24 hours, refreshed on every write. */
const USER_TEMP_TTL_SECONDS = 24 * 60 * 60;

/**
 * Generic TempCache class for handling temporary data in Redis
 *
 * Storage layout: one Redis hash per entity — key `cache:{collection}:{entityId}`,
 * hash field = dot path, value = JSON. Plain numbers are stored as "5", so
 * HINCRBY keeps add/sub atomic on the server side.
 *
 * @template TMapping - The PathMap type (GuildPathMap or UserPathMap)
 */
export class TempCache<TMapping extends PathMap> {
  private client: Redis;
  private key: string;
  private pathMapping: TMapping;
  private ttlSeconds: number | null;
  private localCache: Map<string, any> = new Map();

  /**
   * Create a new TempCache instance
   * @param collectionName - Namespace ("guild_temp" or "user_temp")
   * @param entityId - Unique identifier (guildId or "userId:guildId")
   * @param pathMapping - Path mapping for type-safe access
   */
  constructor(collectionName: string, entityId: string, pathMapping: TMapping) {
    this.client = RedisService.getClient();
    this.key = `cache:${collectionName}:${entityId}`;
    this.pathMapping = pathMapping;
    this.ttlSeconds = collectionName === "user_temp" ? USER_TEMP_TTL_SECONDS : null;
  }

  /**
   * Refresh the key TTL after a write, when the namespace has one
   */
  private async refreshTtl(): Promise<void> {
    if (this.ttlSeconds !== null) {
      await this.client.expire(this.key, this.ttlSeconds);
    }
  }

  /**
   * Read the list of paths that hold Map structures
   */
  private async getMapPaths(): Promise<string[]> {
    const raw = await this.client.hget(this.key, MAP_PATHS_FIELD);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  /**
   * Add or remove a path from the Map tracking list
   */
  private async trackMapPath(path: string, isMap: boolean): Promise<void> {
    const paths = await this.getMapPaths();
    const next = isMap ? paths.concat(path) : paths.filter((p) => p !== path);

    if (next.length > 0) {
      await this.client.hset(this.key, MAP_PATHS_FIELD, JSON.stringify(next));
    } else {
      await this.client.hdel(this.key, MAP_PATHS_FIELD);
    }
  }

  /**
   * Get value by path
   * Supports parent paths (returns all children)
   */
  public async get<T = any>(path: string): Promise<T | null> {
    // Check local cache first (for Map structures)
    if (this.localCache.has(path)) {
      return this.localCache.get(path) as T;
    }

    try {
      // Parent path: collect all child values from the whole hash
      const pathInfo = this.pathMapping[path];
      if (pathInfo && pathInfo.children) {
        const entries = await this.client.hgetall(this.key);
        const result: any = {};

        for (const childKey of pathInfo.children) {
          const value = this.extractValueFromEntries(entries, `${path}.${childKey}`);
          if (value !== undefined) {
            result[childKey] = value;
          }
        }

        return result as T;
      }

      // Leaf path: read the single field
      const raw = await this.client.hget(this.key, path);
      if (raw === null) {
        return null;
      }

      const value = this.parseJson(raw);

      // Restore Map structures tracked in the metadata field
      if (Array.isArray(value)) {
        const mapPaths = await this.getMapPaths();
        if (mapPaths.includes(path)) {
          const map = new Map(value);
          this.localCache.set(path, map);
          return map as T;
        }
      }

      return value as T;
    } catch (error) {
      console.error(`Error getting temp data for ${path}:`, error);
      return null;
    }
  }

  /**
   * Set value by path
   */
  public async set(path: string, value: any): Promise<void> {
    const isMap = value instanceof Map;

    // Store Map structures in local cache
    if (isMap) {
      this.localCache.set(path, value);
      // Convert to array of entries for storage
      value = Array.from(value.entries());
    }

    try {
      await this.client.hset(this.key, path, JSON.stringify(value));
      await this.trackMapPath(path, isMap);
      await this.refreshTtl();
    } catch (error) {
      console.error(`Error setting temp data for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Delete value by path
   */
  public async delete(path: string): Promise<void> {
    // Remove from local cache
    this.localCache.delete(path);

    try {
      await this.client.hdel(this.key, path);

      const paths = await this.getMapPaths();
      if (paths.includes(path)) {
        await this.trackMapPath(path, false);
      }
    } catch (error) {
      console.error(`Error deleting temp data for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Check if path exists and has value
   */
  public async has(path: string): Promise<boolean> {
    if (this.localCache.has(path)) {
      return true;
    }

    const value = await this.get(path);
    return value !== null && value !== undefined;
  }

  /**
   * Clear all temp data for this entity
   */
  public async clear(): Promise<void> {
    this.localCache.clear();

    try {
      await this.client.del(this.key);
    } catch (error) {
      console.error(`Error clearing temp data:`, error);
      throw error;
    }
  }

  /**
   * Get all temp data as a nested object (same shape the MongoDB document had)
   */
  public async all(): Promise<Record<string, any> | null> {
    try {
      const entries = await this.client.hgetall(this.key);
      const result: Record<string, any> = {};

      for (const [field, raw] of Object.entries(entries)) {
        if (field === MAP_PATHS_FIELD) continue;

        const value = this.parseJson(raw);
        const keys = field.split(".");
        let node = result;

        for (let i = 0; i < keys.length - 1; i++) {
          if (typeof node[keys[i]] !== "object" || node[keys[i]] === null) {
            node[keys[i]] = {};
          }
          node = node[keys[i]];
        }

        node[keys[keys.length - 1]] = value;
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      console.error(`Error getting all temp data:`, error);
      return null;
    }
  }

  /**
   * Add to numeric value (atomic HINCRBY)
   */
  public async add(path: string, value: number): Promise<void> {
    await this.change(path, value);
  }

  /**
   * Subtract from numeric value (atomic HINCRBY)
   */
  public async sub(path: string, value: number): Promise<void> {
    await this.change(path, -value);
  }

  /**
   * Atomic numeric change with a read-modify-write fallback for paths
   * that hold non-numeric values
   */
  private async change(path: string, value: number): Promise<void> {
    try {
      await this.client.hincrby(this.key, path, value);
      await this.refreshTtl();
    } catch {
      const current = (await this.get<number>(path)) || 0;
      await this.set(path, current + value);
    }
  }

  /**
   * Push to array
   */
  public async push(path: string, value: any): Promise<void> {
    const current = (await this.get<any[]>(path)) || [];
    if (Array.isArray(current)) {
      await this.set(path, [...current, value]);
    }
  }

  /**
   * Parse a raw hash field, restoring Map structures where tracked
   */
  private parseJson(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  /**
   * Extract a value from parsed hash entries by dot path
   */
  private extractValueFromEntries(entries: Record<string, string>, path: string): any {
    const value = this.parseJson(entries[path] ?? "null");
    if (value === null) return undefined;

    if (Array.isArray(value)) {
      const mapPaths = entries[MAP_PATHS_FIELD]
        ? (JSON.parse(entries[MAP_PATHS_FIELD]) as string[])
        : [];
      if (mapPaths.includes(path)) {
        return new Map(value);
      }
    }

    return value;
  }
}
