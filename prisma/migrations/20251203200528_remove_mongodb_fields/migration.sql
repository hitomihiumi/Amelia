/*
  Warnings:

  - You are about to drop the column `bank` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customItems` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `customRoles` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `dailyTimeout` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `messageCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `robTimeout` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tempGames` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tempVoiceTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `timelyTimeout` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalXp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `voiceTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `wallet` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyTimeout` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workTimeout` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `JoinToCreateChannel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."JoinToCreateChannel" DROP CONSTRAINT "JoinToCreateChannel_guildId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bank",
DROP COLUMN "customItems",
DROP COLUMN "customRoles",
DROP COLUMN "dailyTimeout",
DROP COLUMN "level",
DROP COLUMN "messageCount",
DROP COLUMN "robTimeout",
DROP COLUMN "tempGames",
DROP COLUMN "tempVoiceTime",
DROP COLUMN "timelyTimeout",
DROP COLUMN "totalXp",
DROP COLUMN "voiceTime",
DROP COLUMN "wallet",
DROP COLUMN "weeklyTimeout",
DROP COLUMN "workTimeout",
DROP COLUMN "xp";

-- DropTable
DROP TABLE "public"."JoinToCreateChannel";
