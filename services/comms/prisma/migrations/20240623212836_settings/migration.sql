-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('boolean', 'number', 'string', 'list', 'object', 'objectList');

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "boolean" BOOLEAN DEFAULT false,
    "number" INTEGER,
    "string" TEXT,
    "list" JSONB,
    "object" JSONB,
    "objectList" JSONB[],
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "type" "DataType" NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DataType" NOT NULL,
    "boolean" BOOLEAN DEFAULT false,
    "number" INTEGER,
    "string" TEXT,
    "list" JSONB,
    "object" JSONB,
    "objectList" JSONB[],
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_id_key" ON "AppSetting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_name_key" ON "AppSetting"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_name_key" ON "UserSetting"("name");
