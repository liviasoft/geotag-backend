/*
  Warnings:

  - A unique constraint covering the columns `[feature,name]` on the table `FeatureFlag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[host,route]` on the table `Scope` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user,feature]` on the table `UserFeatureBan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Feature" DROP CONSTRAINT "Feature_scope_fkey";

-- DropForeignKey
ALTER TABLE "FeatureFlag" DROP CONSTRAINT "FeatureFlag_feature_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_resource_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_role_fkey";

-- DropForeignKey
ALTER TABLE "RoleSpecialPermission" DROP CONSTRAINT "RoleSpecialPermission_role_fkey";

-- DropForeignKey
ALTER TABLE "RoleSpecialPermission" DROP CONSTRAINT "RoleSpecialPermission_specialPermission_fkey";

-- DropForeignKey
ALTER TABLE "UserFeatureBan" DROP CONSTRAINT "UserFeatureBan_feature_fkey";

-- DropForeignKey
ALTER TABLE "UserFeatureBan" DROP CONSTRAINT "UserFeatureBan_user_fkey";

-- DropForeignKey
ALTER TABLE "UserResourcePermission" DROP CONSTRAINT "UserResourcePermission_resource_fkey";

-- DropForeignKey
ALTER TABLE "UserResourcePermission" DROP CONSTRAINT "UserResourcePermission_user_fkey";

-- DropForeignKey
ALTER TABLE "UserSpecialPermission" DROP CONSTRAINT "UserSpecialPermission_specialPermission_fkey";

-- DropForeignKey
ALTER TABLE "UserSpecialPermission" DROP CONSTRAINT "UserSpecialPermission_user_fkey";

-- DropIndex
DROP INDEX "FeatureFlag_name_feature_key";

-- DropIndex
DROP INDEX "Scope_route_host_key";

-- DropIndex
DROP INDEX "UserFeatureBan_feature_user_key";

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_feature_name_key" ON "FeatureFlag"("feature", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Scope_host_route_key" ON "Scope"("host", "route");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureBan_user_feature_key" ON "UserFeatureBan"("user", "feature");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_resource_fkey" FOREIGN KEY ("resource") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_scope_fkey" FOREIGN KEY ("scope") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_feature_fkey" FOREIGN KEY ("feature") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSpecialPermission" ADD CONSTRAINT "RoleSpecialPermission_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSpecialPermission" ADD CONSTRAINT "RoleSpecialPermission_specialPermission_fkey" FOREIGN KEY ("specialPermission") REFERENCES "SpecialPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureBan" ADD CONSTRAINT "UserFeatureBan_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureBan" ADD CONSTRAINT "UserFeatureBan_feature_fkey" FOREIGN KEY ("feature") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResourcePermission" ADD CONSTRAINT "UserResourcePermission_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResourcePermission" ADD CONSTRAINT "UserResourcePermission_resource_fkey" FOREIGN KEY ("resource") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpecialPermission" ADD CONSTRAINT "UserSpecialPermission_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSpecialPermission" ADD CONSTRAINT "UserSpecialPermission_specialPermission_fkey" FOREIGN KEY ("specialPermission") REFERENCES "SpecialPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
