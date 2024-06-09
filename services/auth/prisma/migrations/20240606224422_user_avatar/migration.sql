-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "emailVisibility" BOOLEAN DEFAULT false;
