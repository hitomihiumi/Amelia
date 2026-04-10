-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'k.',
    "language" TEXT NOT NULL DEFAULT 'ru',
    "jtcEnabled" BOOLEAN NOT NULL DEFAULT false,
    "jtcChannel" TEXT,
    "jtcCategory" TEXT,
    "jtcDefaultName" TEXT NOT NULL DEFAULT '%{VAR}% channel',
    "counterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "counterCategory" TEXT,
    "counterChannels" JSONB NOT NULL DEFAULT '{}',
    "levelsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "levelsIgnoreChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "levelsIgnoreRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "levelsRoles" JSONB NOT NULL DEFAULT '{}',
    "levelsMessageEnabled" BOOLEAN NOT NULL DEFAULT false,
    "levelsMessageChannel" TEXT,
    "levelsMessageContent" JSONB NOT NULL DEFAULT '{}',
    "levelsMessageDelete" INTEGER NOT NULL DEFAULT 15,
    "findTeamEnabled" BOOLEAN NOT NULL DEFAULT false,
    "findTeamChannel" TEXT,
    "findTeamSendChannel" TEXT,
    "findTeamGames" JSONB NOT NULL DEFAULT '[]',
    "customModals" JSONB NOT NULL DEFAULT '[]',
    "customEmbeds" JSONB NOT NULL DEFAULT '[]',
    "customButtons" JSONB NOT NULL DEFAULT '[]',
    "giveaways" JSONB NOT NULL DEFAULT '[]',
    "currencyEmoji" TEXT,
    "currencyId" TEXT,
    "shopRoles" JSONB NOT NULL DEFAULT '[]',
    "workEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workCooldown" INTEGER NOT NULL DEFAULT 1800,
    "workMin" INTEGER NOT NULL DEFAULT 100,
    "workMax" INTEGER NOT NULL DEFAULT 500,
    "timelyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timelyAmount" INTEGER NOT NULL DEFAULT 400,
    "dailyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyAmount" INTEGER NOT NULL DEFAULT 800,
    "weeklyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyAmount" INTEGER NOT NULL DEFAULT 3000,
    "levelUpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "levelUpAmount" INTEGER NOT NULL DEFAULT 250,
    "bumpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bumpAmount" INTEGER NOT NULL DEFAULT 350,
    "robEnabled" BOOLEAN NOT NULL DEFAULT false,
    "robCooldown" INTEGER NOT NULL DEFAULT 3600,
    "robIncome" JSONB NOT NULL DEFAULT '{"min":100,"max":500,"type":"fixed"}',
    "robPunishment" JSONB NOT NULL DEFAULT '{"min":10,"max":50,"type":"fixed","fail_chance":0.5}',
    "moderationRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inviteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inviteIgnoreChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inviteIgnoreRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inviteDeleteMessage" BOOLEAN NOT NULL DEFAULT false,
    "inviteModerationImmune" BOOLEAN NOT NULL DEFAULT false,
    "invitePunishment" JSONB NOT NULL DEFAULT '{"type":"warn","time":0,"reason":"Auto moderation"}',
    "linksEnabled" BOOLEAN NOT NULL DEFAULT false,
    "linksIgnoreChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linksIgnoreRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linksIgnoreLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linksDeleteMessage" BOOLEAN NOT NULL DEFAULT false,
    "linksModerationImmune" BOOLEAN NOT NULL DEFAULT false,
    "linksPunishment" JSONB NOT NULL DEFAULT '{"type":"warn","time":0,"reason":"Auto moderation"}',
    "commandPermissions" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "voiceTime" INTEGER NOT NULL DEFAULT 0,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "wallet" INTEGER NOT NULL DEFAULT 0,
    "bank" INTEGER NOT NULL DEFAULT 0,
    "customRoles" JSONB NOT NULL DEFAULT '[]',
    "customItems" JSONB NOT NULL DEFAULT '[]',
    "workTimeout" TIMESTAMP(3),
    "timelyTimeout" TIMESTAMP(3),
    "dailyTimeout" TIMESTAMP(3),
    "weeklyTimeout" TIMESTAMP(3),
    "robTimeout" TIMESTAMP(3),
    "balanceNumber" TEXT NOT NULL,
    "balanceMode" BOOLEAN NOT NULL DEFAULT false,
    "balanceSolid" JSONB NOT NULL DEFAULT '{"bg_color":"#000000","text_color":"#ffffff","text":"Kyoko"}',
    "balanceUrl" TEXT,
    "profileBio" TEXT NOT NULL DEFAULT '',
    "profileMode" BOOLEAN NOT NULL DEFAULT false,
    "profileSolid" JSONB NOT NULL DEFAULT '{"bg_color":"#000000","text_color":"#ffffff","text":"Kyoko"}',
    "profileUrl" TEXT,
    "profileColor" TEXT,
    "rankMode" BOOLEAN NOT NULL DEFAULT false,
    "rankSolid" JSONB NOT NULL DEFAULT '{"bg_color":"#000000","text_color":"#ffffff","text":"Kyoko"}',
    "rankUrl" TEXT,
    "rankColor" TEXT,
    "customBadges" JSONB NOT NULL DEFAULT '[]',
    "tempGames" JSONB NOT NULL DEFAULT '{}',
    "jtcPresets" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoinToCreateChannel" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoinToCreateChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guild_id_idx" ON "Guild"("id");

-- CreateIndex
CREATE INDEX "User_userId_guildId_idx" ON "User"("userId", "guildId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_guildId_key" ON "User"("userId", "guildId");

-- CreateIndex
CREATE INDEX "History_guildId_idx" ON "History"("guildId");

-- CreateIndex
CREATE INDEX "History_userId_idx" ON "History"("userId");

-- CreateIndex
CREATE INDEX "History_type_idx" ON "History"("type");

-- CreateIndex
CREATE UNIQUE INDEX "JoinToCreateChannel_channelId_key" ON "JoinToCreateChannel"("channelId");

-- CreateIndex
CREATE INDEX "JoinToCreateChannel_channelId_idx" ON "JoinToCreateChannel"("channelId");

-- CreateIndex
CREATE INDEX "JoinToCreateChannel_guildId_idx" ON "JoinToCreateChannel"("guildId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinToCreateChannel" ADD CONSTRAINT "JoinToCreateChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
