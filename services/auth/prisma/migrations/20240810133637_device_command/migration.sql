/*
  Warnings:

  - You are about to drop the column `type` on the `DeviceCommand` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeviceCommand" DROP COLUMN "type",
ADD COLUMN     "commandType" TEXT NOT NULL DEFAULT 'Command';
