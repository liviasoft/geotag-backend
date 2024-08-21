-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "connectionStatus" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastConnectionStatusCheck" TIMESTAMP(3);
