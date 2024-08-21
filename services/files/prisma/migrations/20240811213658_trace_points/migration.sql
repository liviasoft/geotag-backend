-- DropForeignKey
ALTER TABLE "LocationNote" DROP CONSTRAINT "LocationNote_location_fkey";

-- DropForeignKey
ALTER TABLE "MeasurementFile" DROP CONSTRAINT "MeasurementFile_location_fkey";

-- AlterTable
ALTER TABLE "MeasurementFile" ADD COLUMN     "metadataId" TEXT;

-- CreateTable
CREATE TABLE "MeasurementMetadata" (
    "id" TEXT NOT NULL,
    "frequencyRange" TEXT,
    "gpsTimeStamp" TIMESTAMP(3),
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "altitude" DECIMAL(65,30),
    "numberOfSatellites" INTEGER,
    "timeStart" TIMESTAMP(3),
    "NumberOfMeasurements" INTEGER,
    "AxisDwellTime" INTEGER,
    "Limit" TEXT,
    "avgDBMV" DECIMAL(65,30),
    "minDBMV" DECIMAL(65,30),
    "maxDBMV" DECIMAL(65,30),
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "MeasurementMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "measurementMetadataId" TEXT,
    "measurementFileId" TEXT NOT NULL,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Point" (
    "pointNum" TEXT NOT NULL,
    "amplitude_DBMV" DECIMAL(10,2),
    "frequency_MHz" DECIMAL(10,2),
    "amplitude_VM" DECIMAL(65,30),
    "referenceEMFLimit" DECIMAL(65,30),
    "exposureRatio" DECIMAL(65,30),
    "traceId" TEXT NOT NULL,
    "measurementFileId" TEXT NOT NULL,

    CONSTRAINT "Point_pkey" PRIMARY KEY ("measurementFileId","traceId","pointNum")
);

-- AddForeignKey
ALTER TABLE "LocationNote" ADD CONSTRAINT "LocationNote_location_fkey" FOREIGN KEY ("location") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementFile" ADD CONSTRAINT "MeasurementFile_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "MeasurementMetadata"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementFile" ADD CONSTRAINT "MeasurementFile_location_fkey" FOREIGN KEY ("location") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementMetadata" ADD CONSTRAINT "MeasurementMetadata_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_measurementMetadataId_fkey" FOREIGN KEY ("measurementMetadataId") REFERENCES "MeasurementMetadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_measurementFileId_fkey" FOREIGN KEY ("measurementFileId") REFERENCES "MeasurementFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "Trace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_measurementFileId_fkey" FOREIGN KEY ("measurementFileId") REFERENCES "MeasurementFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
