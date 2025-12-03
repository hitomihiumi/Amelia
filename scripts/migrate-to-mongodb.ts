/**
 * Migration Script: PostgreSQL to MongoDB
 * Migrates level and economy data from PostgreSQL to MongoDB
 */

import { PrismaClient } from "@prisma/client";
import { MongoDBService } from "../src/database/mongodb";
import type { Document } from "mongodb";
import "@hitomihiumi/colors.ts";

const prisma = new PrismaClient();

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

interface UserDataDocument extends Document {
  _id: string;
  data: any;
  updatedAt: Date;
}

/**
 * Migrate user level and economy data to MongoDB
 */
async function migrateUserData(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all users from PostgreSQL
    const users = await prisma.user.findMany();
    stats.total = users.length;

    console.log(`Found ${users.length} users to migrate`.cyan);

    const userDataCollection = MongoDBService.getCollection<UserDataDocument>("user_data");

    for (const user of users) {
      try {
        const entityId = `${user.userId}:${user.guildId}`;

        // Check if already migrated
        const existing = await userDataCollection.findOne({ _id: entityId } as any);

        if (existing && existing.data) {
          console.log(`⏭️  Skipping ${entityId} - already migrated`.yellow);
          stats.skipped++;
          continue;
        }

        // Prepare MongoDB document
        const mongoData: any = {
          level: {
            xp: user.xp,
            total_xp: user.totalXp,
            level: user.level,
            voice_time: user.voiceTime,
            message_count: user.messageCount,
          },
          economy: {
            balance: {
              wallet: user.wallet,
              bank: user.bank,
            },
            inventory: {
              custom: {
                roles: Array.isArray(user.customRoles)
                  ? user.customRoles
                  : JSON.parse((user.customRoles as any) || "[]"),
                items: Array.isArray(user.customItems)
                  ? user.customItems
                  : JSON.parse((user.customItems as any) || "[]"),
              },
            },
            timeout: {
              work: user.workTimeout ? user.workTimeout.getTime() : 0,
              timely: user.timelyTimeout ? user.timelyTimeout.getTime() : 0,
              daily: user.dailyTimeout ? user.dailyTimeout.getTime() : 0,
              weekly: user.weeklyTimeout ? user.weeklyTimeout.getTime() : 0,
              rob: user.robTimeout ? user.robTimeout.getTime() : 0,
            },
          },
        };

        // Insert into MongoDB
        await userDataCollection.updateOne(
          { _id: entityId } as any,
          {
            $set: {
              data: mongoData,
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        );

        console.log(`✅ Migrated ${entityId}`.green);
        stats.migrated++;
      } catch (error) {
        console.error(`❌ Error migrating user ${user.userId}:${user.guildId}:`.red, error);
        stats.errors++;
      }
    }

    return stats;
  } catch (error) {
    console.error("❌ Migration failed:".red, error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log("🚀 Starting migration: PostgreSQL → MongoDB".cyan);
  console.log("=".repeat(60).cyan);

  try {
    // Connect to MongoDB
    await MongoDBService.connect();

    // Run migration
    const stats = await migrateUserData();

    // Print summary
    console.log("\n" + "=".repeat(60).cyan);
    console.log("📊 Migration Summary:".cyan);
    console.log(`   Total users: ${stats.total}`.white);
    console.log(`   ✅ Migrated: ${stats.migrated}`.green);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`.yellow);
    console.log(`   ❌ Errors: ${stats.errors}`.red);
    console.log("=".repeat(60).cyan);

    if (stats.errors === 0) {
      console.log("\n✅ Migration completed successfully!".green);
      console.log("\n⚠️  Next steps:".yellow);
      console.log("   1. Verify data in MongoDB".white);
      console.log("   2. Test the application with MongoDB storage".white);
      console.log("   3. Once verified, run the cleanup migration to remove old columns".white);
      console.log("      (Run: npm run migrate:cleanup)".white);
    } else {
      console.log("\n⚠️  Migration completed with errors. Please review.".yellow);
    }
  } catch (error) {
    console.error("\n❌ Fatal error during migration:".red, error);
    process.exit(1);
  } finally {
    await MongoDBService.disconnect();
    await prisma.$disconnect();
  }
}

// Run migration
main();
