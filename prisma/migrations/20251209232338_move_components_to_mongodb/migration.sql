/*
  Warnings:

  - You are about to drop the column `customButtons` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `customEmbeds` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `customModals` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `customScenarios` on the `Guild` table. All the data in the column will be lost.
  - You are about to drop the column `customSelectMenus` on the `Guild` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Guild" DROP COLUMN "customButtons",
DROP COLUMN "customEmbeds",
DROP COLUMN "customModals",
DROP COLUMN "customScenarios",
DROP COLUMN "customSelectMenus";
