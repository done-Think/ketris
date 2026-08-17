-- AlterTable
ALTER TABLE "oportunidades" ADD COLUMN "arquivadaEm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "oportunidades_tenantId_arquivadaEm_idx" ON "oportunidades"("tenantId", "arquivadaEm");
