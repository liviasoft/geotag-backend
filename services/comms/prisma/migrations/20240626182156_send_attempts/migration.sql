/*
  Warnings:

  - Added the required column `provider` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `PushNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `SMS` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "updated" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PushNotification" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "updated" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SMS" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "updated" TIMESTAMP(3);
