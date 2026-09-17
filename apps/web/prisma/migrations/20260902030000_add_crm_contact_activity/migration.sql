-- CreateEnum
CREATE TYPE "TipoContato" AS ENUM ('PROPRIETARIO', 'LOCATARIO', 'CORRETOR');

-- CreateEnum
CREATE TYPE "TipoAtividadeOportunidade" AS ENUM ('NOTA', 'MUDANCA_STATUS', 'CONTATO_REALIZADO', 'PROPOSTA_RESPONDIDA');

-- CreateTable
CREATE TABLE "contatos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "tipo" "TipoContato" NOT NULL DEFAULT 'LOCATARIO',
    "avatarUrl" TEXT,
    "observacoes" TEXT,
    "ultimaInteracao" TIMESTAMP(3),
    "arquivadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_oportunidade" (
    "id" TEXT NOT NULL,
    "oportunidadeId" TEXT NOT NULL,
    "tipo" "TipoAtividadeOportunidade" NOT NULL,
    "descricao" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNome" TEXT,
    "statusAnterior" "StatusOportunidade",
    "statusNovo" "StatusOportunidade",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atividades_oportunidade_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "oportunidades" ADD COLUMN "contatoId" TEXT;

-- CreateIndex
CREATE INDEX "contatos_tenantId_idx" ON "contatos"("tenantId");

-- CreateIndex
CREATE INDEX "contatos_tenantId_tipo_idx" ON "contatos"("tenantId", "tipo");

-- CreateIndex
CREATE INDEX "contatos_tenantId_arquivadoEm_idx" ON "contatos"("tenantId", "arquivadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "contatos_tenantId_email_key" ON "contatos"("tenantId", "email");

-- CreateIndex
CREATE INDEX "atividades_oportunidade_oportunidadeId_idx" ON "atividades_oportunidade"("oportunidadeId");

-- CreateIndex
CREATE INDEX "atividades_oportunidade_oportunidadeId_createdAt_idx" ON "atividades_oportunidade"("oportunidadeId", "createdAt");

-- CreateIndex
CREATE INDEX "oportunidades_contatoId_idx" ON "oportunidades"("contatoId");

-- AddForeignKey
ALTER TABLE "contatos" ADD CONSTRAINT "contatos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_oportunidade" ADD CONSTRAINT "atividades_oportunidade_oportunidadeId_fkey" FOREIGN KEY ("oportunidadeId") REFERENCES "oportunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "contatos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
