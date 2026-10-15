-- Slot machine on the website (virtual currency only). Off by default, each server turns it on itself.
ALTER TABLE "Guild" ADD COLUMN "slotsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guild" ADD COLUMN "slotsMinBet" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Guild" ADD COLUMN "slotsMaxBet" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "Guild" ADD COLUMN "slotsCooldown" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "User" ADD COLUMN "slotsTimeout" TIMESTAMP(3);
