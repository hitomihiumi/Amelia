-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "customScenarios" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "customSelectMenus" JSONB NOT NULL DEFAULT '[]';
