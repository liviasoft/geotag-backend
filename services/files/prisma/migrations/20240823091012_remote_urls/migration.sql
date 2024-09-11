-- DropForeignKey
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_measurementId_fkey";

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "remoteHTTPUrl" TEXT,
ADD COLUMN     "remoteTCPUrl" TEXT,
ADD COLUMN     "useRemoteConnection" BOOLEAN DEFAULT false;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
