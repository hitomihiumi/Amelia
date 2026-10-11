-- Server banners: a picture with live statistics that the bot sets as the server banner.
ALTER TABLE "Guild" ADD COLUMN "bannerEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guild" ADD COLUMN "bannerInterval" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Guild" ADD COLUMN "bannerActivityWindow" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "Guild" ADD COLUMN "bannerActive" TEXT;
ALTER TABLE "Guild" ADD COLUMN "bannerItems" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Guild" ADD COLUMN "bannerStatus" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Guild" ADD COLUMN "bannerRefreshRequest" TEXT;

-- Level-up announcements: the bot used to announce every level-up and ignored the switch.
-- It now respects it, so servers that have levels on keep their announcements.
UPDATE "Guild" SET "levelsMessageEnabled" = true WHERE "levelsEnabled" = true;
