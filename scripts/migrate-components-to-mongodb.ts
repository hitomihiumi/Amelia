/**
 * Migration script to move guild components data from PostgreSQL to MongoDB
 * Run this BEFORE applying the Prisma migration
 */

import { PrismaClient } from "@prisma/client";
import { MongoClient, Collection } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface GuildDataDocument {
  _id: string;
  data: Record<string, any>;
  mapPaths?: string[];
  updatedAt: Date;
}

async function migrateComponentsToMongoDB() {
  console.log("🚀 Starting migration of components from PostgreSQL to MongoDB...\n");

  // Connect to MongoDB
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error("MONGODB_URL environment variable is not set");
  }

  const mongoClient = new MongoClient(mongoUrl);
  await mongoClient.connect();
  console.log("✅ Connected to MongoDB");

  const db = mongoClient.db();
  const guildDataCollection: Collection<GuildDataDocument> = db.collection("guild_data");

  // Create index
  await guildDataCollection.createIndex({ guildId: 1 });
  console.log("✅ Created MongoDB index\n");

  // Get all guilds from PostgreSQL
  const guilds = await prisma.guild.findMany({
    select: {
      id: true,
      customModals: true,
      customEmbeds: true,
      customButtons: true,
      customSelectMenus: true,
      customScenarios: true,
    },
  });

  console.log(`📊 Found ${guilds.length} guilds to migrate\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const guild of guilds) {
    // Check if guild has any components data
    const hasData =
      (Array.isArray(guild.customModals) && guild.customModals.length > 0) ||
      (Array.isArray(guild.customEmbeds) && guild.customEmbeds.length > 0) ||
      (Array.isArray(guild.customButtons) && guild.customButtons.length > 0) ||
      (Array.isArray(guild.customSelectMenus) && guild.customSelectMenus.length > 0) ||
      (Array.isArray(guild.customScenarios) && guild.customScenarios.length > 0);

    if (!hasData) {
      skippedCount++;
      continue;
    }

    // Prepare data in TempCache format (path keys directly in data object)
    const data: Record<string, any> = {};

    // Build nested structure: utils.components.modals, etc.
    data.utils = {
      components: {
        modals: (guild.customModals as any[]) || [],
        embed: (guild.customEmbeds as any[]) || [],
        buttons: (guild.customButtons as any[]) || [],
        selectMenus: (guild.customSelectMenus as any[]) || [],
        scenarios: (guild.customScenarios as any[]) || [],
      },
    };

    // Upsert to MongoDB
    await guildDataCollection.updateOne(
      { _id: guild.id },
      {
        $set: {
          data: data,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    migratedCount++;
    console.log(`✅ Migrated guild: ${guild.id}`);
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   - Total guilds: ${guilds.length}`);
  console.log(`   - Migrated: ${migratedCount}`);
  console.log(`   - Skipped (no data): ${skippedCount}`);

  // Cleanup
  await mongoClient.close();
  await prisma.$disconnect();

  console.log("\n🎉 Migration completed successfully!");
  console.log("\n⚠️  IMPORTANT: Now you can safely apply the Prisma migration:");
  console.log("   npx prisma migrate deploy");
}

migrateComponentsToMongoDB().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
