BEGIN;

-- CreateEnum
CREATE TYPE "EmailVerificationPurpose" AS ENUM ('SIGNUP', 'EMAIL_CHANGE');

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_codes" DROP CONSTRAINT "password_reset_codes_userId_fkey";

-- DropIndex
DROP INDEX "usuarios_email_key";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "creci" TEXT,
ADD COLUMN     "emailVerificadoEm" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "termosAceitosEm" TIMESTAMP(3),
ADD COLUMN     "versaoSessao" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "password_reset_codes" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "purpose" "EmailVerificationPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_codes_userId_tenantId_purpose_createdAt_idx" ON "email_verification_codes"("userId", "tenantId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_tenantId_email_key" ON "usuarios"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_id_tenantId_key" ON "usuarios"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "usuarios"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_codes" ADD CONSTRAINT "password_reset_codes_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "usuarios"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "usuarios"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "usuarios" AS u
SET "telefone" = p."telefone", "creci" = p."creci"
FROM "perfis_publicos_corretor" AS p
WHERE p."usuarioId" = u."id";

COMMIT;
