-- CreateEnum
CREATE TYPE "StatusChamadoManutencao" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO');

-- CreateEnum
CREATE TYPE "PrioridadeChamadoManutencao" AS ENUM ('NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TipoAtividadeChamadoManutencao" AS ENUM ('NOTA', 'MUDANCA_STATUS', 'ANEXO_ADICIONADO');

-- AlterTable
ALTER TABLE "cobrancas" ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "descricao" TEXT,
ALTER COLUMN "contratoId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "chamados_manutencao" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prioridade" "PrioridadeChamadoManutencao" NOT NULL DEFAULT 'NORMAL',
    "status" "StatusChamadoManutencao" NOT NULL DEFAULT 'ABERTO',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "abertoPorId" TEXT NOT NULL,
    "abertoPorNome" TEXT NOT NULL,
    "resolvidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chamados_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_chamado_manutencao" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "tipo" "TipoAtividadeChamadoManutencao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atividades_chamado_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos_chamado_manutencao" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_chamado_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chamados_manutencao_tenantId_idx" ON "chamados_manutencao"("tenantId");

-- CreateIndex
CREATE INDEX "chamados_manutencao_tenantId_status_idx" ON "chamados_manutencao"("tenantId", "status");

-- CreateIndex
CREATE INDEX "chamados_manutencao_imovelId_idx" ON "chamados_manutencao"("imovelId");

-- CreateIndex
CREATE INDEX "atividades_chamado_manutencao_chamadoId_idx" ON "atividades_chamado_manutencao"("chamadoId");

-- CreateIndex
CREATE INDEX "atividades_chamado_manutencao_chamadoId_createdAt_idx" ON "atividades_chamado_manutencao"("chamadoId", "createdAt");

-- CreateIndex
CREATE INDEX "anexos_chamado_manutencao_chamadoId_idx" ON "anexos_chamado_manutencao"("chamadoId");

-- CreateIndex
CREATE UNIQUE INDEX "cobrancas_codigo_key" ON "cobrancas"("codigo");

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados_manutencao" ADD CONSTRAINT "chamados_manutencao_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_chamado_manutencao" ADD CONSTRAINT "atividades_chamado_manutencao_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "chamados_manutencao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos_chamado_manutencao" ADD CONSTRAINT "anexos_chamado_manutencao_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "chamados_manutencao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
