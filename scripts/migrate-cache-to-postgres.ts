/**
 * Migration Script: MongoDB cache → PostgreSQL
 *
 * Moves the persistent data that used to live in MongoDB into PostgreSQL:
 *   - user_data  → User columns (level, economy)
 *   - user_temp  → User.games (game state only, the rest stays ephemeral)
 *   - guild_data → Guild component columns
 *
 * Run AFTER `npx prisma migrate deploy` and BEFORE shutting MongoDB down:
 *   npm run migrate:cache
 *
 * The script is idempotent: rows that already hold the data are skipped.
 * It needs MONGODB_URL in the environment; the `mongodb` package stays in
 * devDependencies solely for this one-shot migration.
 */

import { MongoClient, Document } from "mongodb";
import { DatabaseService } from "../src/database/prisma";
import "@hitomihiumi/colors.ts";

const prisma = DatabaseService.getInstance();

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

interface CacheDocument extends Document {
  _id: string;
  data: any;
}

function balanceNumberFor(userId: string, guildId: string): string {
  const digit = () => Math.floor(Math.random() * 10);
  return `${guildId.slice(0, 4)} ${userId.slice(0, 4)} ${digit()}${digit()}${digit()}${digit()} ${digit()}${digit()}${digit()}${digit()}`;
}

function msToDate(value: any): Date | null {
  return typeof value === "number" && value > 0 ? new Date(value) : null;
}

/** The Postgres columns are int4; a few cached values (corrupt voice_time) exceed it. */
function clampInt(value: any): number {
  const num = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.max(0, Math.min(num, 2147483647));
}

/** A user row that still holds the column defaults counts as not migrated yet. */
function userIsPristine(row: {
  xp: number;
  totalXp: number;
  wallet: number;
  bank: number;
}): boolean {
  return row.xp === 0 && row.totalXp === 0 && row.wallet === 0 && row.bank === 0;
}

async function migrateUsers(users: CacheDocument[]): Promise<MigrationStats> {
  const stats: MigrationStats = { total: users.length, migrated: 0, skipped: 0, errors: 0 };

  for (const doc of users) {
    const [userId, guildId] = String(doc._id).split(":");
    if (!userId || !guildId || !doc.data) {
      stats.skipped++;
      continue;
    }

    try {
      // Cached users can belong to guilds the bot has since left (no Guild row).
      await prisma.guild.upsert({
        where: { id: guildId },
        update: {},
        create: { id: guildId },
      });

      const row = await prisma.user.upsert({
        where: { userId_guildId: { userId, guildId } },
        update: {},
        create: {
          userId,
          guildId,
          balanceNumber: balanceNumberFor(userId, guildId),
        },
      });

      if (!userIsPristine(row)) {
        console.log(`⏭️  Skipping user ${doc._id} - already migrated`.yellow);
        stats.skipped++;
        continue;
      }

      const level = doc.data.level ?? {};
      const economy = doc.data.economy ?? {};
      const balance = economy.balance ?? {};
      const inventory = economy.inventory?.custom ?? {};
      const timeout = economy.timeout ?? {};

      await prisma.user.update({
        where: { userId_guildId: { userId, guildId } },
        data: {
          xp: clampInt(level.xp),
          totalXp: clampInt(level.total_xp),
          level: clampInt(level.level ?? 1),
          voiceTime: clampInt(level.voice_time),
          messageCount: clampInt(level.message_count),
          wallet: clampInt(balance.wallet),
          bank: clampInt(balance.bank),
          customRoles: inventory.roles ?? [],
          customItems: inventory.items ?? [],
          workTimeout: msToDate(timeout.work),
          timelyTimeout: msToDate(timeout.timely),
          dailyTimeout: msToDate(timeout.daily),
          weeklyTimeout: msToDate(timeout.weekly),
          robTimeout: msToDate(timeout.rob),
        },
      });

      console.log(`✅ Migrated user ${doc._id}`.green);
      stats.migrated++;
    } catch (error) {
      console.error(`❌ Error migrating user ${doc._id}:`.red, error);
      stats.errors++;
    }
  }

  return stats;
}

async function migrateGames(games: CacheDocument[]): Promise<number> {
  let migrated = 0;

  for (const doc of games) {
    const state = doc.data?.temp?.games ?? doc.data?.["temp.games"];
    if (!state || typeof state !== "object") continue;

    const [userId, guildId] = String(doc._id).split(":");
    if (!userId || !guildId) continue;

    try {
      await prisma.user.update({
        where: { userId_guildId: { userId, guildId } },
        data: { games: state },
      });
      migrated++;
    } catch {
      // The user row may not exist yet — game state alone is not worth creating one.
    }
  }

  return migrated;
}

async function migrateComponents(guilds: CacheDocument[]): Promise<MigrationStats> {
  const stats: MigrationStats = { total: guilds.length, migrated: 0, skipped: 0, errors: 0 };

  for (const doc of guilds) {
    const guildId = String(doc._id);
    const components = doc.data?.utils?.components ?? doc.data?.["utils.components"];
    if (!components || typeof components !== "object") {
      stats.skipped++;
      continue;
    }

    try {
      const row = await prisma.guild.upsert({
        where: { id: guildId },
        update: {},
        create: { id: guildId },
      });

      const hasComponents =
        (row.componentsModals as unknown[]).length > 0 ||
        (row.componentsEmbeds as unknown[]).length > 0 ||
        (row.componentsButtons as unknown[]).length > 0;

      if (hasComponents) {
        console.log(`⏭️  Skipping guild ${guildId} - already migrated`.yellow);
        stats.skipped++;
        continue;
      }

      await prisma.guild.update({
        where: { id: guildId },
        data: {
          componentsModals: components.modals ?? [],
          componentsEmbeds: components.embed ?? [],
          componentsButtons: components.buttons ?? [],
          componentsSelectMenus: components.selectMenus ?? [],
          componentsScenarios: components.scenarios ?? [],
        },
      });

      console.log(`✅ Migrated guild ${guildId} components`.green);
      stats.migrated++;
    } catch (error) {
      console.error(`❌ Error migrating guild ${guildId}:`.red, error);
      stats.errors++;
    }
  }

  return stats;
}

async function main(): Promise<void> {
  const url = process.env.MONGODB_URL;
  if (!url) {
    console.error("❌ MONGODB_URL is not set - it is required to read the old cache.".red);
    process.exit(1);
  }

  console.log("🚀 Starting migration: MongoDB cache → PostgreSQL".cyan);
  console.log("=".repeat(60).cyan);

  const mongo = new MongoClient(url);

  try {
    await mongo.connect();
    const db = mongo.db("amelia_cache");

    const users = (await db.collection("user_data").find().toArray()) as unknown as CacheDocument[];
    const userStats = await migrateUsers(users);

    const games = (await db.collection("user_temp").find().toArray()) as unknown as CacheDocument[];
    const gamesMigrated = await migrateGames(games);

    const guilds = (await db.collection("guild_data").find().toArray()) as unknown as CacheDocument[];
    const guildStats = await migrateComponents(guilds);

    console.log("\n" + "=".repeat(60).cyan);
    console.log("📊 Migration Summary:".cyan);
    console.log(
      `   Users: ${userStats.migrated} migrated, ${userStats.skipped} skipped, ${userStats.errors} errors`
        .white,
    );
    console.log(`   Game states: ${gamesMigrated} migrated`.white);
    console.log(
      `   Guild components: ${guildStats.migrated} migrated, ${guildStats.skipped} skipped, ${guildStats.errors} errors`
        .white,
    );
    console.log("=".repeat(60).cyan);

    if (userStats.errors === 0 && guildStats.errors === 0) {
      console.log("\n✅ Migration completed successfully!".green);
      console.log("\n⚠️  Next steps:".yellow);
      console.log("   1. Spot-check data with `npm run prisma:studio`".white);
      console.log("   2. Restart the bot (it no longer touches MongoDB)".white);
      console.log("   3. Shut the MongoDB container down".white);
    } else {
      console.log("\n⚠️  Migration completed with errors. Please review.".yellow);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("\n❌ Fatal error during migration:".red, error);
    process.exit(1);
  } finally {
    await mongo.close();
    await prisma.$disconnect();
  }
}

main();
