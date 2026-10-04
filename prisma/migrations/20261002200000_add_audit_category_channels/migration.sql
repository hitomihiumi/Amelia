-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "auditCategories" JSONB NOT NULL DEFAULT '{}';
