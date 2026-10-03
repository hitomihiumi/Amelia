import { Redis } from "ioredis";
import "@hitomihiumi/colors.ts";

/**
 * Singleton Redis client for temp data caching and the status heartbeat
 */
class RedisService {
  private static client: Redis | null = null;
  private static isConnected: boolean = false;

  private constructor() {}

  /**
   * Get Redis client instance
   */
  public static getClient(): Redis {
    if (!RedisService.client) {
      const url = process.env.REDIS_URL;
      if (!url) {
        throw new Error("REDIS_URL is not defined in environment variables");
      }
      RedisService.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    }
    return RedisService.client;
  }

  /**
   * Connect to Redis
   */
  public static async connect(): Promise<void> {
    if (RedisService.isConnected) {
      return;
    }

    try {
      const client = RedisService.getClient();
      await client.connect();
      await client.ping();
      RedisService.isConnected = true;
      console.log("✅ Connected to Redis cache".green);
    } catch (error) {
      console.error("❌ Failed to connect to Redis:".red, error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public static async disconnect(): Promise<void> {
    if (!RedisService.isConnected) {
      return;
    }

    try {
      const client = RedisService.getClient();
      await client.quit();
      RedisService.isConnected = false;
      RedisService.client = null;
      console.log("✅ Disconnected from Redis cache".green);
    } catch (error) {
      console.error("❌ Failed to disconnect from Redis:".red, error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  public static isConnectedToRedis(): boolean {
    return RedisService.isConnected;
  }
}

export { RedisService };
