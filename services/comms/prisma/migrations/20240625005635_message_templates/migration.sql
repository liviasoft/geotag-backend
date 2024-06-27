/*
  Warnings:

  - Added the required column `messageTemplateId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "messageTemplateId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emailTemplate" TEXT,
    "smsTemplate" TEXT,
    "pushNotificationTemplate" TEXT,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_name_key" ON "MessageTemplate"("name");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_messageTemplateId_fkey" FOREIGN KEY ("messageTemplateId") REFERENCES "MessageTemplate"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
