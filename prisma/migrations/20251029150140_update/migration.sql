-- AlterTable
ALTER TABLE "User" ADD COLUMN     "levelupMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "levelupSolid" JSONB NOT NULL DEFAULT '{"bg_color":"#000000","first_component":"#ffffff","second_component":"#422242","third_component":"#C30F45"}',
ADD COLUMN     "levelupUrl" TEXT;
