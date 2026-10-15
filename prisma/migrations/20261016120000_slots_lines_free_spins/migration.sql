-- Slot machine: paylines and free spins. The free spins a member has won are kept here, so closing
-- the page does not lose them.
ALTER TABLE "User" ADD COLUMN "slotsFreeSpins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "slotsFreeBet" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "slotsFreeLines" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "slotsFreeWon" INTEGER NOT NULL DEFAULT 0;
