import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma Client instance
 */
class DatabaseService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });
    }
    return DatabaseService.instance;
  }

  public static async connect(): Promise<void> {
    const client = DatabaseService.getInstance();
    await client.$connect();
    console.log("✅ Connected to PostgreSQL database".green);
  }

  public static async disconnect(): Promise<void> {
    const client = DatabaseService.getInstance();
    await client.$disconnect();
    console.log("Database disconnected".gray);
  }
}

export const prisma = DatabaseService.getInstance();
export { DatabaseService };
