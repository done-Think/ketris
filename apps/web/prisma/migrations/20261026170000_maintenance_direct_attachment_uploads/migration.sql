ALTER TABLE "anexos_chamado_manutencao" ADD COLUMN "uploadId" TEXT;
CREATE UNIQUE INDEX "anexos_chamado_manutencao_uploadId_key" ON "anexos_chamado_manutencao"("uploadId");
