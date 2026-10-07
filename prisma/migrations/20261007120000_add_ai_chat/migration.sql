-- AI chat: per-server switch, chat channels, model choice, extra persona text and usage limits.
ALTER TABLE "Guild" ADD COLUMN "aiEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guild" ADD COLUMN "aiChannels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Guild" ADD COLUMN "aiIgnoreChannels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Guild" ADD COLUMN "aiModel" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE "Guild" ADD COLUMN "aiPersona" TEXT;
ALTER TABLE "Guild" ADD COLUMN "aiLimits" JSONB NOT NULL DEFAULT '{"user_per_minute":3,"user_per_day":40,"guild_per_day":400}';
