-- Level and economy move back from the MongoDB cache
ALTER TABLE "User" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "voiceTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "messageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wallet" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bank" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customRoles" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "customItems" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "workTimeout" TIMESTAMP(3),
ADD COLUMN     "timelyTimeout" TIMESTAMP(3),
ADD COLUMN     "dailyTimeout" TIMESTAMP(3),
ADD COLUMN     "weeklyTimeout" TIMESTAMP(3),
ADD COLUMN     "robTimeout" TIMESTAMP(3),
ADD COLUMN     "games" JSONB NOT NULL DEFAULT '{}';

-- Custom components move back from the MongoDB cache
ALTER TABLE "Guild" ADD COLUMN     "componentsModals" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "componentsEmbeds" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "componentsButtons" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "componentsSelectMenus" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "componentsScenarios" JSONB NOT NULL DEFAULT '[]';

-- Leaderboard indexes
CREATE INDEX "User_guildId_totalXp_idx" ON "User"("guildId", "totalXp");
CREATE INDEX "User_guildId_voiceTime_idx" ON "User"("guildId", "voiceTime");
