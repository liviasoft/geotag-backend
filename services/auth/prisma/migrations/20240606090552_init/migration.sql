-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('boolean', 'number', 'string', 'list', 'object', 'objectList');

-- CreateEnum
CREATE TYPE "Service" AS ENUM ('BACKEND', 'FRONTEND');

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
    "verified" BOOLEAN DEFAULT false,
    "username" TEXT,
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

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "create" BOOLEAN NOT NULL,
    "readOwn" BOOLEAN NOT NULL,
    "readAny" BOOLEAN NOT NULL,
    "updateOwn" BOOLEAN NOT NULL,
    "updateAny" BOOLEAN NOT NULL,
    "deleteOwn" BOOLEAN NOT NULL,
    "deleteAny" BOOLEAN NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "Scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL,
    "scope" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),
    "service" "Service"[] DEFAULT ARRAY['BACKEND']::"Service"[],

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialPermission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "SpecialPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSpecialPermission" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specialPermission" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "RoleSpecialPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFeatureBan" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "UserFeatureBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserResourcePermission" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "create" BOOLEAN NOT NULL,
    "updateOwn" BOOLEAN NOT NULL,
    "updateAny" BOOLEAN NOT NULL,
    "deleteOwn" BOOLEAN NOT NULL,
    "deleteAny" BOOLEAN NOT NULL,
    "readOwn" BOOLEAN NOT NULL,
    "readAny" BOOLEAN NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "UserResourcePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSpecialPermission" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "specialPermission" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "UserSpecialPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserHasRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
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
CREATE UNIQUE INDEX "UserSetting_name_key" ON "UserSetting"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "Resource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_resource_key" ON "RolePermission"("role", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "Scope_id_key" ON "Scope"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Scope_name_key" ON "Scope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_name_key" ON "Feature"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_name_feature_key" ON "FeatureFlag"("name", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialPermission_name_key" ON "SpecialPermission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RoleSpecialPermission_role_specialPermission_key" ON "RoleSpecialPermission"("role", "specialPermission");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureBan_feature_user_key" ON "UserFeatureBan"("feature", "user");

-- CreateIndex
CREATE UNIQUE INDEX "UserResourcePermission_user_resource_key" ON "UserResourcePermission"("user", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "UserSpecialPermission_user_specialPermission_key" ON "UserSpecialPermission"("user", "specialPermission");

-- CreateIndex
CREATE UNIQUE INDEX "_UserHasRoles_AB_unique" ON "_UserHasRoles"("A", "B");

-- CreateIndex
CREATE INDEX "_UserHasRoles_B_index" ON "_UserHasRoles"("B");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_resource_fkey" FOREIGN KEY ("resource") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_scope_fkey" FOREIGN KEY ("scope") REFERENCES "Scope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_feature_fkey" FOREIGN KEY ("feature") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSpecialPermission" ADD CONSTRAINT "RoleSpecialPermission_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSpecialPermission" ADD CONSTRAINT "RoleSpecialPermission_specialPermission_fkey" FOREIGN KEY ("specialPermission") REFERENCES "SpecialPermission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureBan" ADD CONSTRAINT "UserFeatureBan_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureBan" ADD CONSTRAINT "UserFeatureBan_feature_fkey" FOREIGN KEY ("feature") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResourcePermission" ADD CONSTRAINT "UserResourcePermission_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResourcePermission" ADD CONSTRAINT "UserResourcePermission_resource_fkey" FOREIGN KEY ("resource") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpecialPermission" ADD CONSTRAINT "UserSpecialPermission_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpecialPermission" ADD CONSTRAINT "UserSpecialPermission_specialPermission_fkey" FOREIGN KEY ("specialPermission") REFERENCES "SpecialPermission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserHasRoles" ADD CONSTRAINT "_UserHasRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserHasRoles" ADD CONSTRAINT "_UserHasRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
