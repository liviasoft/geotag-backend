/*
  Warnings:

  - Added the required column `file` to the `MeasurementFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MeasurementFile" ADD COLUMN     "file" TEXT NOT NULL;
