-- Premium access of a server (the AI chat needs it) and the AI limits administrators set for everyone.
ALTER TABLE "Guild" ADD COLUMN "premium" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guild" ADD COLUMN "premiumUntil" TIMESTAMP(3);
ALTER TABLE "Guild" ADD COLUMN "premiumNote" TEXT;

CREATE TABLE "AiConfig" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "quota" JSONB NOT NULL DEFAULT '{}',
    "caps" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AiConfig_pkey" PRIMARY KEY ("id")
);
