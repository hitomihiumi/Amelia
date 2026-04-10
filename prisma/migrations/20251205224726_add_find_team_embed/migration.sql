-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "findTeamEmbed" JSONB NOT NULL DEFAULT '{"title":null,"description":null,"color":null,"thumbnail":null,"image":null,"footer":null}',
ADD COLUMN     "findTeamSelectPlaceholder" TEXT,
ALTER COLUMN "robPunishment" SET DEFAULT '{"min":10,"max":50,"type":"fixed","fail_chance":25}';
