-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "remoteHTTPUrl" TEXT,
ADD COLUMN     "remoteTCPUrl" TEXT,
ADD COLUMN     "useRemoteConnection" BOOLEAN DEFAULT false;
