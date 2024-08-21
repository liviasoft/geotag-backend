/*
  Warnings:

  - You are about to drop the column `authorId` on the `LocationNote` table. All the data in the column will be lost.
  - You are about to drop the `MeasurementFiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LocationNote" DROP CONSTRAINT "LocationNote_authorId_fkey";

-- DropForeignKey
ALTER TABLE "MeasurementFiles" DROP CONSTRAINT "MeasurementFiles_location_fkey";

-- AlterTable
ALTER TABLE "LocationNote" DROP COLUMN "authorId",
ADD COLUMN     "author" TEXT,
ADD COLUMN     "isSystemNote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "measurementFile" TEXT;

-- DropTable
DROP TABLE "MeasurementFiles";

-- CreateTable
CREATE TABLE "MeasurementFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileDeviceUrl" TEXT NOT NULL,
    "timeStamp" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeasurementFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LocationNote" ADD CONSTRAINT "LocationNote_measurementFile_fkey" FOREIGN KEY ("measurementFile") REFERENCES "MeasurementFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationNote" ADD CONSTRAINT "LocationNote_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementFile" ADD CONSTRAINT "MeasurementFile_location_fkey" FOREIGN KEY ("location") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
