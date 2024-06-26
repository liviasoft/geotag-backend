/*
  Warnings:

  - You are about to drop the column `text` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `PushNotification` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `SMS` table. All the data in the column will be lost.
  - Added the required column `content` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `PushNotification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `SMS` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "text",
ADD COLUMN     "Options" JSONB,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PushNotification" DROP COLUMN "text",
ADD COLUMN     "Options" JSONB,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SMS" DROP COLUMN "text",
ADD COLUMN     "Options" JSONB,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'PENDING';
