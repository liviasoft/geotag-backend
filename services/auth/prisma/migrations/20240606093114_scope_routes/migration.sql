/*
  Warnings:

  - A unique constraint covering the columns `[route,host]` on the table `Scope` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `host` to the `Scope` table without a default value. This is not possible if the table is not empty.
  - Added the required column `route` to the `Scope` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Scope_id_key";

-- AlterTable
ALTER TABLE "Scope" ADD COLUMN     "host" TEXT NOT NULL,
ADD COLUMN     "route" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Scope_route_host_key" ON "Scope"("route", "host");
