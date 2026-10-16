-- Slot machine: 3, 4 or 5 reels. A free spin round keeps the width it was won on.
ALTER TABLE "User" ADD COLUMN "slotsFreeReels" INTEGER NOT NULL DEFAULT 3;
