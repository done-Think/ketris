ALTER TABLE "chamados_manutencao" ADD COLUMN "atendimentoEm" TIMESTAMP(3);

CREATE INDEX "chamados_manutencao_tenantId_atendimentoEm_idx" ON "chamados_manutencao"("tenantId", "atendimentoEm");
