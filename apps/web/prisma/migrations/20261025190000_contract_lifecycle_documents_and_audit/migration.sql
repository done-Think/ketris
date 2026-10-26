BEGIN;

-- CreateEnum
CREATE TYPE "MetodoAssinaturaContrato" AS ENUM ('MANUAL', 'PROVIDER');

-- CreateEnum
CREATE TYPE "ContractAuditAction" AS ENUM ('CREATED', 'UPDATED', 'MANUAL_SIGNATURE_REGISTERED', 'DOCUMENT_UPLOADED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContractAuditActorType" AS ENUM ('USER', 'SYSTEM');

-- DropIndex
DROP INDEX "contratos_codigo_key";

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "canceladoEm" TIMESTAMP(3),
ADD COLUMN     "canceladoPorId" TEXT,
ADD COLUMN     "criadoPorId" TEXT,
ADD COLUMN     "encerradoEm" TIMESTAMP(3),
ADD COLUMN     "encerradoPorId" TEXT,
ADD COLUMN     "motivoCancelamento" TEXT,
ADD COLUMN     "motivoEncerramento" TEXT;

-- AlterTable
ALTER TABLE "documentos_contrato" ADD COLUMN     "enviadoPorId" TEXT,
ADD COLUMN     "objectKey" TEXT,
ADD COLUMN     "sha256" TEXT,
ADD COLUMN     "tamanhoBytes" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "partes_contrato" ADD COLUMN     "createdAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "assinaturas" ADD COLUMN     "createdAt" TIMESTAMP(3),
ADD COLUMN     "documentoId" TEXT,
ADD COLUMN     "ipRegistro" TEXT,
ADD COLUMN     "metodo" "MetodoAssinaturaContrato",
ADD COLUMN     "sha256Documento" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "userAgentRegistro" TEXT;

-- CreateTable
CREATE TABLE "contract_audit_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorType" "ContractAuditActorType" NOT NULL DEFAULT 'USER',
    "action" "ContractAuditAction" NOT NULL,
    "changedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromStatus" "StatusContrato",
    "toStatus" "StatusContrato",
    "reason" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_audit_events_tenantId_contractId_createdAt_idx" ON "contract_audit_events"("tenantId", "contractId", "createdAt");

-- CreateIndex
CREATE INDEX "contract_audit_events_actorUserId_idx" ON "contract_audit_events"("actorUserId");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_id_tenantId_key" ON "contratos"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_tenantId_codigo_key" ON "contratos"("tenantId", "codigo");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_encerradoPorId_fkey" FOREIGN KEY ("encerradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_contrato" ADD CONSTRAINT "documentos_contrato_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos_contrato"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_audit_events" ADD CONSTRAINT "contract_audit_events_contractId_tenantId_fkey" FOREIGN KEY ("contractId", "tenantId") REFERENCES "contratos"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_audit_events" ADD CONSTRAINT "contract_audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "partes_contrato" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "assinaturas" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

COMMIT;
