/*
  Warnings:

  - You are about to drop the column `lat` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `Location` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "lat",
DROP COLUMN "lng",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "latitude" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "locationType" TEXT,
ADD COLUMN     "longitude" DECIMAL(65,30) NOT NULL;

-- CreateTable
CREATE TABLE "LocationType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "iconUrl" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_locationType_fkey" FOREIGN KEY ("locationType") REFERENCES "LocationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
