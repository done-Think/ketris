-- CreateEnum
CREATE TYPE "PerfilPublicoStatus" AS ENUM ('RASCUNHO', 'PUBLICADO');

-- CreateTable
CREATE TABLE "perfis_publicos_corretor" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "creci" TEXT,
    "telefone" TEXT,
    "regiao" TEXT,
    "bairros" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "especialidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "disponibilidade" TEXT,
    "corPrimaria" TEXT,
    "corSecundaria" TEXT,
    "corFundo" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "status" "PerfilPublicoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "publicadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_publicos_corretor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_publicos_imobiliaria" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "headline" TEXT,
    "resumo" TEXT,
    "legalCreci" TEXT,
    "sede" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "cobertura" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "segmentos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "anosDeMercado" INTEGER,
    "corFundo" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "status" "PerfilPublicoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "publicadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_publicos_imobiliaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_publicos_imobiliaria_destaques" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "perfis_publicos_imobiliaria_destaques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfis_publicos_corretor_usuarioId_key" ON "perfis_publicos_corretor"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_publicos_imobiliaria_tenantId_key" ON "perfis_publicos_imobiliaria"("tenantId");

-- CreateIndex
CREATE INDEX "perfis_publicos_imobiliaria_destaques_usuarioId_idx" ON "perfis_publicos_imobiliaria_destaques"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_publicos_imobiliaria_destaques_perfilId_usuarioId_key" ON "perfis_publicos_imobiliaria_destaques"("perfilId", "usuarioId");

-- AddForeignKey
ALTER TABLE "perfis_publicos_corretor" ADD CONSTRAINT "perfis_publicos_corretor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfis_publicos_imobiliaria" ADD CONSTRAINT "perfis_publicos_imobiliaria_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfis_publicos_imobiliaria_destaques" ADD CONSTRAINT "perfis_publicos_imobiliaria_destaques_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis_publicos_imobiliaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfis_publicos_imobiliaria_destaques" ADD CONSTRAINT "perfis_publicos_imobiliaria_destaques_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
