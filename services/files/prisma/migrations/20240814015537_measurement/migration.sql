/*
  Warnings:

  - You are about to drop the column `AxisDwellTime` on the `MeasurementMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `NumberOfMeasurements` on the `MeasurementMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `avgDBMV` on the `MeasurementMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `maxDBMV` on the `MeasurementMetadata` table. All the data in the column will be lost.
  - You are about to drop the column `minDBMV` on the `MeasurementMetadata` table. All the data in the column will be lost.
  - Added the required column `updated` to the `MeasurementMetadata` table without a default value. This is not possible if the table is not empty.
  - Added the required column `measurementId` to the `Trace` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MeasurementMetadata" DROP COLUMN "AxisDwellTime",
DROP COLUMN "NumberOfMeasurements",
DROP COLUMN "avgDBMV",
DROP COLUMN "maxDBMV",
DROP COLUMN "minDBMV",
ADD COLUMN     "axisDwellTime" INTEGER,
ADD COLUMN     "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numberOfMeasurements" INTEGER,
ADD COLUMN     "updated" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Trace" ADD COLUMN     "measurementId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "avg_DBM_M2" DECIMAL(65,30) NOT NULL,
    "min_DBM_M2" DECIMAL(65,30) NOT NULL,
    "max_DBM_M2" DECIMAL(65,30) NOT NULL,
    "test_status" TEXT NOT NULL,
    "time_in_seconds" INTEGER NOT NULL,
    "total_avg_DBM_M2" DECIMAL(65,30) NOT NULL,
    "total_min_DBM_M2" DECIMAL(65,30) NOT NULL,
    "total_max_DBM_M2" DECIMAL(65,30) NOT NULL,
    "total_time_in_seconds" INTEGER NOT NULL,
    "measurementMetadataId" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_measurementMetadataId_fkey" FOREIGN KEY ("measurementMetadataId") REFERENCES "MeasurementMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
