-- AlterTable
ALTER TABLE "AppSetting" ALTER COLUMN "created" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LocationNote" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "LocationType" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Measurement" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MeasurementFile" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MeasurementMetadata" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Trace" ALTER COLUMN "created" DROP NOT NULL,
ALTER COLUMN "updated" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "created" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserSetting" ALTER COLUMN "created" DROP NOT NULL;
