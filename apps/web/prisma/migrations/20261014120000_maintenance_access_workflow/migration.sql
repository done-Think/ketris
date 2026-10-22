-- Existing records remain unlinked until a tenant admin regularizes them.
ALTER TYPE "StatusChamadoManutencao" ADD VALUE 'AGUARDANDO_CONFIRMACAO';
ALTER TYPE "StatusChamadoManutencao" ADD VALUE 'CONTESTADO';
ALTER TYPE "StatusChamadoManutencao" ADD VALUE 'CANCELADO';
ALTER TYPE "TipoAtividadeChamadoManutencao" ADD VALUE 'EDICAO';
ALTER TYPE "TipoAtividadeChamadoManutencao" ADD VALUE 'RESPONSAVEL_ALTERADO';
ALTER TYPE "TipoAtividadeChamadoManutencao" ADD VALUE 'PRESTADOR_ALTERADO';
ALTER TYPE "TipoAtividadeChamadoManutencao" ADD VALUE 'TROCA_SOLICITADA';
ALTER TYPE "TipoAtividadeChamadoManutencao" ADD VALUE 'TROCA_DECIDIDA';
ALTER TYPE "TipoAtividadeChamadoManutencao" ADD VALUE 'EXCLUSAO';
ALTER TYPE "TipoAtividadeChamadoManutencao" ADD VALUE 'RESTAURACAO';
ALTER TABLE "imoveis" ADD COLUMN "proprietarioId" TEXT;
ALTER TABLE "partes_contrato" ADD COLUMN "usuarioId" TEXT;
ALTER TABLE "chamados_manutencao"
  ADD COLUMN "contratoId" TEXT,
  ADD COLUMN "responsavelId" TEXT,
  ADD COLUMN "prestadorNome" TEXT,
  ADD COLUMN "prestadorTelefone" TEXT,
  ADD COLUMN "prestadorEmail" TEXT,
  ADD COLUMN "prestadorObservacoes" TEXT,
  ADD COLUMN "concluidoPorId" TEXT,
  ADD COLUMN "concluidoPorPapel" "PapelUsuario",
  ADD COLUMN "excluidoEm" TIMESTAMP(3),
  ADD COLUMN "excluidoPorId" TEXT;
ALTER TABLE "atividades_chamado_manutencao" ADD COLUMN "detalhes" JSONB;
CREATE TYPE "StatusSolicitacaoTrocaPrestador" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');
CREATE TABLE "solicitacoes_troca_prestador" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chamadoId" TEXT NOT NULL,
  "justificativa" TEXT NOT NULL,
  "solicitanteId" TEXT NOT NULL,
  "solicitanteNome" TEXT NOT NULL,
  "status" "StatusSolicitacaoTrocaPrestador" NOT NULL DEFAULT 'PENDENTE',
  "decisaoJustificativa" TEXT,
  "decididoPorId" TEXT,
  "decididoPorNome" TEXT,
  "decididoEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "imoveis_tenantId_proprietarioId_idx" ON "imoveis"("tenantId", "proprietarioId");
CREATE INDEX "partes_contrato_usuarioId_idx" ON "partes_contrato"("usuarioId");
CREATE INDEX "chamados_manutencao_tenantId_excluidoEm_idx" ON "chamados_manutencao"("tenantId", "excluidoEm");
CREATE INDEX "chamados_manutencao_contratoId_idx" ON "chamados_manutencao"("contratoId");
CREATE INDEX "chamados_manutencao_responsavelId_idx" ON "chamados_manutencao"("responsavelId");
CREATE INDEX "solicitacoes_troca_prestador_chamadoId_status_idx" ON "solicitacoes_troca_prestador"("chamadoId", "status");
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "partes_contrato" ADD CONSTRAINT "partes_contrato_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "solicitacoes_troca_prestador" ADD CONSTRAINT "solicitacoes_troca_prestador_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "chamados_manutencao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
