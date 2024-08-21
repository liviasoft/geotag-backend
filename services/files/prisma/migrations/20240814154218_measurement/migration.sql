-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_measurementId_fkey";

-- AlterTable
ALTER TABLE "Trace" ALTER COLUMN "measurementFileId" DROP NOT NULL,
ALTER COLUMN "measurementId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
