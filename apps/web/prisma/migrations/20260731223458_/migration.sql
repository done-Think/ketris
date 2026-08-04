-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'PROPRIETARIO', 'CORRETOR');

-- CreateEnum
CREATE TYPE "FinalidadeImovel" AS ENUM ('ALUGUEL', 'VENDA');

-- CreateEnum
CREATE TYPE "StatusImovel" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ALUGADO', 'VENDIDO', 'INATIVO');

-- CreateEnum
CREATE TYPE "GarantiaContratual" AS ENUM ('FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'NENHUMA');

-- CreateEnum
CREATE TYPE "StatusOportunidade" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_NEGOCIACAO', 'ACEITA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('RASCUNHO', 'AGUARDANDO_ASSINATURA', 'ATIVO');

-- CreateEnum
CREATE TYPE "PapelParteContrato" AS ENUM ('LOCADOR', 'LOCATARIO', 'FIADOR');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('PENDENTE', 'ASSINADA');

-- CreateEnum
CREATE TYPE "TipoCobranca" AS ENUM ('A_RECEBER', 'A_PAGAR');

-- CreateEnum
CREATE TYPE "StatusCobranca" AS ENUM ('PENDENTE', 'PAGA', 'ATRASADA', 'AGENDADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "corPrimaria" TEXT,
    "corSecundaria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'CORRETOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imoveis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "finalidade" "FinalidadeImovel" NOT NULL,
    "tipo" TEXT NOT NULL,
    "quartos" INTEGER,
    "banheiros" INTEGER,
    "vagas" INTEGER,
    "areaM2" DECIMAL(10,2),
    "valor" DECIMAL(12,2) NOT NULL,
    "condominio" DECIMAL(10,2),
    "iptu" DECIMAL(10,2),
    "status" "StatusImovel" NOT NULL DEFAULT 'RASCUNHO',
    "publicadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "midias" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'foto',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "midias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oportunidades" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "interessadoNome" TEXT NOT NULL,
    "interessadoEmail" TEXT NOT NULL,
    "interessadoTelefone" TEXT,
    "valorProposto" DECIMAL(12,2) NOT NULL,
    "prazoContratoMeses" INTEGER,
    "inicioPretendido" TIMESTAMP(3),
    "garantiaContratual" "GarantiaContratual" NOT NULL DEFAULT 'NENHUMA',
    "condicoesEspeciais" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observacoes" TEXT,
    "status" "StatusOportunidade" NOT NULL DEFAULT 'RASCUNHO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oportunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "oportunidadeOrigemId" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'RASCUNHO',
    "ativadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partes_contrato" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "papel" "PapelParteContrato" NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,

    CONSTRAINT "partes_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "parteContratoId" TEXT NOT NULL,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'PENDENTE',
    "assinadaEm" TIMESTAMP(3),

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobrancas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "tipo" "TipoCobranca" NOT NULL DEFAULT 'A_RECEBER',
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "formaPagamento" TEXT,
    "comprovanteUrl" TEXT,
    "status" "StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "pagoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobrancas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "usuarios_tenantId_idx" ON "usuarios"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_tenantId_email_key" ON "usuarios"("tenantId", "email");

-- CreateIndex
CREATE INDEX "imoveis_tenantId_idx" ON "imoveis"("tenantId");

-- CreateIndex
CREATE INDEX "imoveis_tenantId_status_idx" ON "imoveis"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_imovelId_key" ON "enderecos"("imovelId");

-- CreateIndex
CREATE INDEX "midias_imovelId_idx" ON "midias"("imovelId");

-- CreateIndex
CREATE INDEX "oportunidades_tenantId_idx" ON "oportunidades"("tenantId");

-- CreateIndex
CREATE INDEX "oportunidades_tenantId_status_idx" ON "oportunidades"("tenantId", "status");

-- CreateIndex
CREATE INDEX "oportunidades_imovelId_idx" ON "oportunidades"("imovelId");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_oportunidadeOrigemId_key" ON "contratos"("oportunidadeOrigemId");

-- CreateIndex
CREATE INDEX "contratos_tenantId_idx" ON "contratos"("tenantId");

-- CreateIndex
CREATE INDEX "contratos_tenantId_status_idx" ON "contratos"("tenantId", "status");

-- CreateIndex
CREATE INDEX "partes_contrato_contratoId_idx" ON "partes_contrato"("contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_parteContratoId_key" ON "assinaturas"("parteContratoId");

-- CreateIndex
CREATE INDEX "cobrancas_tenantId_idx" ON "cobrancas"("tenantId");

-- CreateIndex
CREATE INDEX "cobrancas_tenantId_status_idx" ON "cobrancas"("tenantId", "status");

-- CreateIndex
CREATE INDEX "cobrancas_contratoId_idx" ON "cobrancas"("contratoId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "midias" ADD CONSTRAINT "midias_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_oportunidadeOrigemId_fkey" FOREIGN KEY ("oportunidadeOrigemId") REFERENCES "oportunidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partes_contrato" ADD CONSTRAINT "partes_contrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_parteContratoId_fkey" FOREIGN KEY ("parteContratoId") REFERENCES "partes_contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobrancas" ADD CONSTRAINT "cobrancas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
