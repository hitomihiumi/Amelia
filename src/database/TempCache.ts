import { Collection } from "mongodb";
import { MongoDBService } from "./mongodb";
import type { PathMap } from "./mappings/GuildMapping";

/**
 * Document structure in MongoDB for temp data
 */
interface TempDocument {
  _id: string;
  data: Record<string, any>;
  /** Tracks which paths contain Map structures */
  mapPaths?: string[];
  updatedAt: Date;
}

/**
 * Generic TempCache class for handling temporary data in MongoDB
 * @template TMapping - The PathMap type (GuildPathMap or UserPathMap)
 */
export class TempCache<TMapping extends PathMap> {
  private collection: Collection<TempDocument>;
  private entityId: string;
  private pathMapping: TMapping;
  private localCache: Map<string, any> = new Map();

  /**
   * Create a new TempCache instance
   * @param collectionName - MongoDB collection name ("guild_temp" or "user_temp")
   * @param entityId - Unique identifier (guildId or "userId:guildId")
   * @param pathMapping - Path mapping for type-safe access
   */
  constructor(collectionName: string, entityId: string, pathMapping: TMapping) {
    this.collection = MongoDBService.getCollection<TempDocument>(collectionName);
    this.entityId = entityId;
    this.pathMapping = pathMapping;
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
      const doc = await this.collection.findOne({ _id: this.entityId });

      if (!doc || !doc.data) {
        return null;
      }

      // Check if this is a parent path
      const pathInfo = this.pathMapping[path];

      if (pathInfo && pathInfo.children) {
        // Parent path: collect all child values
        const result: any = {};

        for (const childKey of pathInfo.children) {
          const childPath = `${path}.${childKey}`;
          const value = this.extractValue(doc.data, childPath, doc.mapPaths);
          if (value !== undefined) {
            result[childKey] = value;
          }
        }

        return result as T;
      }

      // Leaf path: extract single value
      const value = this.extractValue(doc.data, path, doc.mapPaths);

      // Cache Maps in local cache
      if (value instanceof Map) {
        this.localCache.set(path, value);
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
      // Convert to array of entries for MongoDB
      value = Array.from(value.entries());
    }

    try {
      const updateData = this.buildUpdateObject(path, value);
      const update: any = {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      };

      // Track Map paths
      if (isMap) {
        update.$addToSet = { mapPaths: path };
      } else {
        update.$pull = { mapPaths: path };
      }

      await this.collection.updateOne({ _id: this.entityId }, update, { upsert: true });
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
      const unsetData = this.buildUnsetObject(path);

      await this.collection.updateOne(
        { _id: this.entityId },
        {
          $unset: unsetData,
          $pull: { mapPaths: path },
          $set: { updatedAt: new Date() },
        },
      );
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
      await this.collection.deleteOne({ _id: this.entityId });
    } catch (error) {
      console.error(`Error clearing temp data:`, error);
      throw error;
    }
  }

  /**
   * Get all temp data
   */
  public async all(): Promise<Record<string, any> | null> {
    try {
      const doc = await this.collection.findOne({ _id: this.entityId });
      return doc?.data || null;
    } catch (error) {
      console.error(`Error getting all temp data:`, error);
      return null;
    }
  }

  /**
   * Extract value from nested object by path
   * @param data - The data object to extract from
   * @param path - The path to extract
   * @param mapPaths - Array of paths that should be converted to Maps
   */
  private extractValue(data: any, path: string, mapPaths?: string[]): any {
    const keys = path.split(".");
    let current = data;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    // Check if this path should be a Map (using metadata)
    if (mapPaths && mapPaths.includes(path) && Array.isArray(current)) {
      return new Map(current);
    }

    return current;
  }

  /**
   * Build MongoDB update object from path
   */
  private buildUpdateObject(path: string, value: any): Record<string, any> {
    const keys = path.split(".");
    const mongoPath = `data.${keys.join(".")}`;
    return { [mongoPath]: value };
  }

  /**
   * Build MongoDB unset object from path
   */
  private buildUnsetObject(path: string): Record<string, any> {
    const keys = path.split(".");
    const mongoPath = `data.${keys.join(".")}`;
    return { [mongoPath]: "" };
  }

  /**
   * Add to numeric value
   */
  public async add(path: string, value: number): Promise<void> {
    const current = (await this.get<number>(path)) || 0;
    await this.set(path, current + value);
  }

  /**
   * Subtract from numeric value
   */
  public async sub(path: string, value: number): Promise<void> {
    const current = (await this.get<number>(path)) || 0;
    await this.set(path, current - value);
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
}
