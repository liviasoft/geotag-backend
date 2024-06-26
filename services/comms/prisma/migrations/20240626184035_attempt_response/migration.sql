/*
  Warnings:

  - You are about to drop the column `Options` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `Options` on the `PushNotification` table. All the data in the column will be lost.
  - You are about to drop the column `Options` on the `SMS` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Email" DROP COLUMN "Options",
ADD COLUMN     "options" JSONB,
ADD COLUMN     "response" TEXT;

-- AlterTable
ALTER TABLE "PushNotification" DROP COLUMN "Options",
ADD COLUMN     "options" JSONB,
ADD COLUMN     "response" TEXT;

-- AlterTable
ALTER TABLE "SMS" DROP COLUMN "Options",
ADD COLUMN     "options" JSONB,
ADD COLUMN     "response" TEXT;
