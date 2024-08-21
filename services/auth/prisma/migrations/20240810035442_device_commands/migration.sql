-- CreateTable
CREATE TABLE "DeviceCommand" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" TEXT,
    "queryReturn" TEXT,
    "defaultValue" TEXT,
    "defaultUnit" TEXT,
    "Range" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Command',

    CONSTRAINT "DeviceCommand_pkey" PRIMARY KEY ("id")
);
