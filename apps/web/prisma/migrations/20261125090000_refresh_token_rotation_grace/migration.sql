-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN "rotatedAt" TIMESTAMP(3),
ADD COLUMN "replacedById" TEXT;
