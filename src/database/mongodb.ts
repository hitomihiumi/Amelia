import { MongoClient, Db, Collection, Document } from "mongodb";
import "@hitomihiumi/colors.ts";

/**
 * Singleton MongoDB Client instance for temp data caching
 */
class MongoDBService {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;
  private static isConnected: boolean = false;

  private constructor() {}

  /**
   * Get MongoDB client instance
   */
  public static getClient(): MongoClient {
    if (!MongoDBService.client) {
      const url = process.env.MONGODB_URL;
      if (!url) {
        throw new Error("MONGODB_URL is not defined in environment variables");
      }
      MongoDBService.client = new MongoClient(url);
    }
    return MongoDBService.client;
  }

  /**
   * Get database instance
   */
  public static getDatabase(): Db {
    if (!MongoDBService.db) {
      const client = MongoDBService.getClient();
      MongoDBService.db = client.db("amelia_cache");
    }
    return MongoDBService.db;
  }

  /**
   * Get collection by name
   */
  public static getCollection<T extends Document = Document>(name: string): Collection<T> {
    const db = MongoDBService.getDatabase();
    return db.collection<T>(name);
  }

  /**
   * Connect to MongoDB
   */
  public static async connect(): Promise<void> {
    if (MongoDBService.isConnected) {
      return;
    }

    try {
      const client = MongoDBService.getClient();
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      MongoDBService.isConnected = true;
      console.log("✅ Connected to MongoDB cache database".green);

      // Create indexes for temp collections
      const guildTempCollection = MongoDBService.getCollection("guild_temp");
      const userTempCollection = MongoDBService.getCollection("user_temp");
      const userDataCollection = MongoDBService.getCollection("user_data");

      await guildTempCollection.createIndex({ guildId: 1 });
      await userTempCollection.createIndex({ userId: 1, guildId: 1 });
      await userDataCollection.createIndex({ userId: 1, guildId: 1 });

      // TTL index for automatic cleanup of temp data (24 hours)
      await userTempCollection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

      // Note: user_data collection does NOT have TTL - it's persistent
      console.log("✅ MongoDB indexes created successfully".green);
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:".red, error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public static async disconnect(): Promise<void> {
    if (!MongoDBService.isConnected) {
      return;
    }

    try {
      const client = MongoDBService.getClient();
      await client.close();
      MongoDBService.isConnected = false;
      MongoDBService.client = null;
      MongoDBService.db = null;
      console.log("✅ Disconnected from MongoDB cache database".green);
    } catch (error) {
      console.error("❌ Failed to disconnect from MongoDB:".red, error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  public static isConnectedToMongoDB(): boolean {
    return MongoDBService.isConnected;
  }
}

export { MongoDBService };
