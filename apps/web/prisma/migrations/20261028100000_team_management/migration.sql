-- CreateEnum
CREATE TYPE "MotivoTransferenciaCarteira" AS ENUM ('MANUAL', 'DESATIVACAO');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "primeiroContatoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "convites_equipe" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceitoEm" TIMESTAMP(3),
    "criadoPorId" TEXT,
    "criadoPorNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convites_equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas_corretor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "vendasMensais" INTEGER NOT NULL,
    "definidoPorId" TEXT,
    "definidoPorNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_corretor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias_carteira" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "motivo" "MotivoTransferenciaCarteira" NOT NULL,
    "origemId" TEXT,
    "origemNome" TEXT NOT NULL,
    "destinoId" TEXT,
    "destinoNome" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNome" TEXT NOT NULL,
    "imovelIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "leadIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transferencias_carteira_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convites_equipe_tokenHash_key" ON "convites_equipe"("tokenHash");

-- CreateIndex
CREATE INDEX "convites_equipe_tenantId_idx" ON "convites_equipe"("tenantId");

-- CreateIndex
CREATE INDEX "convites_equipe_criadoPorId_idx" ON "convites_equipe"("criadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "convites_equipe_usuarioId_tenantId_key" ON "convites_equipe"("usuarioId", "tenantId");

-- CreateIndex
CREATE INDEX "metas_corretor_tenantId_usuarioId_createdAt_idx" ON "metas_corretor"("tenantId", "usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "metas_corretor_definidoPorId_idx" ON "metas_corretor"("definidoPorId");

-- CreateIndex
CREATE INDEX "transferencias_carteira_tenantId_createdAt_idx" ON "transferencias_carteira"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "transferencias_carteira_origemId_idx" ON "transferencias_carteira"("origemId");

-- CreateIndex
CREATE INDEX "transferencias_carteira_destinoId_idx" ON "transferencias_carteira"("destinoId");

-- CreateIndex
CREATE INDEX "transferencias_carteira_autorId_idx" ON "transferencias_carteira"("autorId");

-- AddForeignKey
ALTER TABLE "convites_equipe" ADD CONSTRAINT "convites_equipe_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites_equipe" ADD CONSTRAINT "convites_equipe_usuarioId_tenantId_fkey" FOREIGN KEY ("usuarioId", "tenantId") REFERENCES "usuarios"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites_equipe" ADD CONSTRAINT "convites_equipe_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_corretor" ADD CONSTRAINT "metas_corretor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_corretor" ADD CONSTRAINT "metas_corretor_usuarioId_tenantId_fkey" FOREIGN KEY ("usuarioId", "tenantId") REFERENCES "usuarios"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_corretor" ADD CONSTRAINT "metas_corretor_definidoPorId_fkey" FOREIGN KEY ("definidoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_carteira" ADD CONSTRAINT "transferencias_carteira_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_carteira" ADD CONSTRAINT "transferencias_carteira_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_carteira" ADD CONSTRAINT "transferencias_carteira_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_carteira" ADD CONSTRAINT "transferencias_carteira_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

