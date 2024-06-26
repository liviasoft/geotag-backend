/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_recipient_fkey";

-- DropForeignKey
ALTER TABLE "PushNotification" DROP CONSTRAINT "PushNotification_id_fkey";

-- DropForeignKey
ALTER TABLE "SMS" DROP CONSTRAINT "SMS_id_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phoneData" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipient_fkey" FOREIGN KEY ("recipient") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SMS" ADD CONSTRAINT "SMS_id_fkey" FOREIGN KEY ("id") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_id_fkey" FOREIGN KEY ("id") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotification" ADD CONSTRAINT "PushNotification_id_fkey" FOREIGN KEY ("id") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
