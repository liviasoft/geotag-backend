/*
  Warnings:

  - You are about to drop the column `Range` on the `DeviceCommand` table. All the data in the column will be lost.
  - Added the required column `command` to the `DeviceCommand` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeviceCommand" DROP COLUMN "Range",
ADD COLUMN     "command" TEXT NOT NULL,
ADD COLUMN     "range" TEXT;
