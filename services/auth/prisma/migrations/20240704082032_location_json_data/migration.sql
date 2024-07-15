-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "additionalData" JSONB,
ADD COLUMN     "addressData" JSONB,
ADD COLUMN     "city" JSONB,
ADD COLUMN     "country" JSONB,
ADD COLUMN     "deviceData" JSONB,
ADD COLUMN     "state" JSONB;
