-- CreateEnum
CREATE TYPE "EstagioLead" AS ENUM ('NOVO', 'EM_CONTATO', 'VISITA_MARCADA', 'PROPOSTA');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "interesse" TEXT NOT NULL,
    "orcamento" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "estagio" "EstagioLead" NOT NULL DEFAULT 'NOVO',
    "observacoes" TEXT,
    "oportunidadeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_oportunidadeId_key" ON "leads"("oportunidadeId");

-- CreateIndex
CREATE INDEX "leads_tenantId_idx" ON "leads"("tenantId");

-- CreateIndex
CREATE INDEX "leads_tenantId_estagio_idx" ON "leads"("tenantId", "estagio");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_oportunidadeId_fkey" FOREIGN KEY ("oportunidadeId") REFERENCES "oportunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;
