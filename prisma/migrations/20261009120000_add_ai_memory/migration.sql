-- AI chat: long-term memories of members and the per-server switches for memory and images.
ALTER TABLE "Guild" ADD COLUMN "aiOptions" JSONB NOT NULL DEFAULT '{"short_term":true,"long_term":true,"images":true}';

CREATE TABLE "AiMemory" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiMemory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiMemory_guildId_userId_idx" ON "AiMemory"("guildId", "userId");

ALTER TABLE "AiMemory" ADD CONSTRAINT "AiMemory_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
