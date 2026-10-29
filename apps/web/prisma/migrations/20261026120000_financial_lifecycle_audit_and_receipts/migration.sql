BEGIN;

-- CreateEnum
CREATE TYPE "ChargeAuditAction" AS ENUM ('CREATED', 'UPDATED', 'PAYMENT_REGISTERED', 'PAYMENT_REVERSED', 'CANCELLED', 'DELETED');

-- CreateEnum
CREATE TYPE "ChargeAuditActorType" AS ENUM ('USER', 'SYSTEM');



-- Atrasada passa a ser derivada da data (pendente ou agendada com vencimento antes de hoje).
UPDATE "cobrancas" SET "status" = 'PENDENTE' WHERE "status" = 'ATRASADA';

-- AlterEnum
CREATE TYPE "StatusCobranca_new" AS ENUM ('PENDENTE', 'PAGA', 'AGENDADA', 'CANCELADA');
ALTER TABLE "cobrancas" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "cobrancas" ALTER COLUMN "status" TYPE "StatusCobranca_new" USING ("status"::text::"StatusCobranca_new");
ALTER TYPE "StatusCobranca" RENAME TO "StatusCobranca_old";
ALTER TYPE "StatusCobranca_new" RENAME TO "StatusCobranca";
DROP TYPE "StatusCobranca_old";
ALTER TABLE "cobrancas" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';

-- DropForeignKey
ALTER TABLE "cobrancas" DROP CONSTRAINT "cobrancas_contratoId_fkey";

-- DropIndex
DROP INDEX "cobrancas_codigo_key";

-- AlterTable
ALTER TABLE "cobrancas" DROP COLUMN "comprovanteUrl",
ADD COLUMN     "canceladoEm" TIMESTAMP(3),
ADD COLUMN     "canceladoPorId" TEXT,
ADD COLUMN     "comprovanteAtualId" TEXT,
ADD COLUMN     "criadoPorId" TEXT,
ADD COLUMN     "motivoCancelamento" TEXT,
ADD COLUMN     "pagoPorId" TEXT;

-- CreateTable
CREATE TABLE "comprovantes_cobranca" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cobrancaId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tipoConteudo" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "enviadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprovantes_cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_audit_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "chargeId" TEXT,
    "chargeCode" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorType" "ChargeAuditActorType" NOT NULL DEFAULT 'USER',
    "action" "ChargeAuditAction" NOT NULL,
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromStatus" "StatusCobranca",
    "toStatus" "StatusCobranca",
    "reason" TEXT,
    "receiptId" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charge_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comprovantes_cobranca_objectKey_key" ON "comprovantes_cobranca"("objectKey");

-- CreateIndex
CREATE INDEX "comprovantes_cobranca_tenantId_cobrancaId_idx" ON "comprovantes_cobranca"("tenantId", "cobrancaId");

-- CreateIndex
CREATE INDEX "charge_audit_events_tenantId_chargeId_createdAt_idx" ON "charge_audit_events"("tenantId", "chargeId", "createdAt");

-- CreateIndex
CREATE INDEX "charge_audit_events_actorUserId_idx" ON "charge_audit_events"("actorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "cobrancas_comprovanteAtualId_key" ON "cobrancas"("comprovanteAtualId");

-- CreateIndex
CREATE INDEX "cobrancas_tenantId_vencimento_idx" ON "cobrancas"("tenantId", "vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "cobrancas_tenantId_codigo_key" ON "cobrancas"("tenantId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cobrancas_id_tenantId_key" ON "cobrancas"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_pagoPorId_fkey" FOREIGN KEY ("pagoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_comprovanteAtualId_fkey" FOREIGN KEY ("comprovanteAtualId") REFERENCES "comprovantes_cobranca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovantes_cobranca" ADD CONSTRAINT "comprovantes_cobranca_cobrancaId_tenantId_fkey" FOREIGN KEY ("cobrancaId", "tenantId") REFERENCES "cobrancas"("id", "tenantId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovantes_cobranca" ADD CONSTRAINT "comprovantes_cobranca_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovantes_cobranca" ADD CONSTRAINT "comprovantes_cobranca_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_audit_events" ADD CONSTRAINT "charge_audit_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_audit_events" ADD CONSTRAINT "charge_audit_events_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "cobrancas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_audit_events" ADD CONSTRAINT "charge_audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
