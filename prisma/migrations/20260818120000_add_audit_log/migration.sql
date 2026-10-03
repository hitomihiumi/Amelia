-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "auditEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "auditChannel" TEXT,
ADD COLUMN     "auditIgnoreChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "auditIgnoreRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "auditIgnoreBots" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "auditWebhookName" TEXT,
ADD COLUMN     "auditWebhookAvatar" TEXT,
ADD COLUMN     "auditEvents" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "GuildWebhook" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuildWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuildWebhook_guildId_idx" ON "GuildWebhook"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildWebhook_guildId_channelId_key" ON "GuildWebhook"("guildId", "channelId");

-- AddForeignKey
ALTER TABLE "GuildWebhook" ADD CONSTRAINT "GuildWebhook_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
