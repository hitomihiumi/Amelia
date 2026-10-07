-- Servers the bot is in and their daily usage, for the admin panel.
CREATE TABLE "GuildPresence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "ownerId" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT,
    "boostTier" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildPresence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GuildStat" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "commands" INTEGER NOT NULL DEFAULT 0,
    "components" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,
    "joins" INTEGER NOT NULL DEFAULT 0,
    "leaves" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuildStat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommandStat" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommandStat_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GuildPresence_leftAt_idx" ON "GuildPresence"("leftAt");
CREATE INDEX "GuildStat_day_idx" ON "GuildStat"("day");
CREATE UNIQUE INDEX "GuildStat_guildId_day_key" ON "GuildStat"("guildId", "day");
CREATE INDEX "CommandStat_day_idx" ON "CommandStat"("day");
CREATE UNIQUE INDEX "CommandStat_guildId_day_name_key" ON "CommandStat"("guildId", "day", "name");
