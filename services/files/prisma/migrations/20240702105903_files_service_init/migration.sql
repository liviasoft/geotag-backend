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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVisibility" BOOLEAN DEFAULT false,
    "verified" BOOLEAN DEFAULT false,
    "username" TEXT,
    "phone" TEXT,
    "phoneData" JSONB,
    "avatar" TEXT,
    "avatarUrl" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_name_key" ON "UserSetting"("name");
