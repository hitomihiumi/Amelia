import { TempCache } from "../database";
import { PathMap } from "../database/mappings/UserMapping";
import { GetSchemaValueType, LiteralSchemaKey } from "../types/helpers/SchemaKeys";

/**
 * Generic Cache class with type-safe path operations
 * @template TSchema - The cache schema interface (e.g., GuildCache, UserCache)
 * @template TKey - The type of allowed cache keys (union of string literals)
 */
export class Cache<TSchema, TKey extends string = string> {
  private db: TempCache<PathMap>;

  constructor(namespace: string, identifier: string, pathMap: PathMap) {
    this.db = new TempCache<typeof pathMap>(namespace, identifier, pathMap);
  }

  /**
   * Get value by path (ASYNC - must use await)
   * Supports both literal paths (with precise type inference) and dynamic paths
   */
  public async get<K extends LiteralSchemaKey<TSchema>>(
    path: K,
  ): Promise<GetSchemaValueType<TSchema, K>>;
  public async get(path: string): Promise<any>;
  public async get(path: string): Promise<any> {
    return await this.db.get(path);
  }

  /**
   * Set value by path (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async set<K extends LiteralSchemaKey<TSchema>>(
    path: K,
    value: GetSchemaValueType<TSchema, K>,
  ): Promise<void>;
  public async set(path: string, value: any): Promise<void>;
  public async set(path: string, value: any): Promise<void> {
    return await this.db.set(path, value);
  }

  /**
   * Add to numeric value (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async add<K extends LiteralSchemaKey<TSchema>>(
    path: K,
    value: GetSchemaValueType<TSchema, K> extends number ? number : never,
  ): Promise<void>;
  public async add(path: string, value: number): Promise<void>;
  public async add(path: string, value: number): Promise<void> {
    return await this.db.add(path, value);
  }

  /**
   * Subtract from numeric value (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async sub<K extends LiteralSchemaKey<TSchema>>(
    path: K,
    value: GetSchemaValueType<TSchema, K> extends number ? number : never,
  ): Promise<void>;
  public async sub(path: string, value: number): Promise<void>;
  public async sub(path: string, value: number): Promise<void> {
    return await this.db.sub(path, value);
  }

  /**
   * Push to array (ASYNC - must use await)
   * Supports both literal paths (with type checking) and dynamic paths
   */
  public async push<K extends LiteralSchemaKey<TSchema>>(
    path: K,
    value: GetSchemaValueType<TSchema, K> extends Array<infer T> ? T : never,
  ): Promise<void>;
  public async push(path: string, value: any): Promise<void>;
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

  public async all(): Promise<Record<string, any> | null> {
    return await this.db.all();
  }

  public async clear(): Promise<void> {
    return await this.db.clear();
  }
}
