/*
  Warnings:

  - You are about to drop the column `additionalData` on the `Location` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "additionalData",
ADD COLUMN     "address" TEXT;
