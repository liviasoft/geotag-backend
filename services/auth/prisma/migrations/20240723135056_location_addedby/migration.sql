-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "addedBy" TEXT;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "addedBy" TEXT;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
