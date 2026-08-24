-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "modLogChannel" TEXT,
ADD COLUMN     "modDmNotify" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "modWarnExpiry" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "modWarnThresholds" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "modReportForm" JSONB NOT NULL DEFAULT '{"enabled":false,"channel":null,"cooldown":600,"max_pending":3,"allow_anonymous":false,"require_target":true,"allow_banned":false,"fields":[],"success_message":null,"approve_message":null,"reject_message":null}',
ADD COLUMN     "modAppealForm" JSONB NOT NULL DEFAULT '{"enabled":false,"channel":null,"cooldown":86400,"max_pending":1,"allow_anonymous":false,"require_target":false,"allow_banned":true,"fields":[],"success_message":null,"approve_message":null,"reject_message":null}',
ADD COLUMN     "modCaseSeq" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "modReportSeq" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "modAppealSeq" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ModerationCase" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "caseNumber" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "duration" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'command',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationSubmission" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT,
    "caseId" TEXT,
    "answers" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "handledBy" TEXT,
    "handledAt" TIMESTAMP(3),
    "response" TEXT,
    "channelId" TEXT,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModerationCase_guildId_targetId_idx" ON "ModerationCase"("guildId", "targetId");

-- CreateIndex
CREATE INDEX "ModerationCase_guildId_type_active_idx" ON "ModerationCase"("guildId", "type", "active");

-- CreateIndex
CREATE INDEX "ModerationCase_expiresAt_idx" ON "ModerationCase"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ModerationCase_guildId_caseNumber_key" ON "ModerationCase"("guildId", "caseNumber");

-- CreateIndex
CREATE INDEX "ModerationSubmission_guildId_kind_status_idx" ON "ModerationSubmission"("guildId", "kind", "status");

-- CreateIndex
CREATE INDEX "ModerationSubmission_guildId_authorId_idx" ON "ModerationSubmission"("guildId", "authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ModerationSubmission_guildId_kind_number_key" ON "ModerationSubmission"("guildId", "kind", "number");

-- AddForeignKey
ALTER TABLE "ModerationCase" ADD CONSTRAINT "ModerationCase_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationSubmission" ADD CONSTRAINT "ModerationSubmission_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationSubmission" ADD CONSTRAINT "ModerationSubmission_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ModerationCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
