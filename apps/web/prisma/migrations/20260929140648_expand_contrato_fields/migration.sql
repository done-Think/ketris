-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'TEMPORADA');

-- CreateEnum
CREATE TYPE "IndiceReajuste" AS ENUM ('IPCA', 'IGPM', 'INPC');

-- CreateEnum
CREATE TYPE "TipoGarantia" AS ENUM ('FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'TITULO_CAPITALIZACAO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusContrato" ADD VALUE 'EM_REVISAO';
ALTER TYPE "StatusContrato" ADD VALUE 'ASSINADO';
ALTER TYPE "StatusContrato" ADD VALUE 'ENCERRADO';
ALTER TYPE "StatusContrato" ADD VALUE 'CANCELADO';

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "codigo" TEXT NOT NULL,
ADD COLUMN     "dataFim" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataInicio" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "diaVencimento" INTEGER NOT NULL,
ADD COLUMN     "indiceReajuste" "IndiceReajuste" NOT NULL,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "tipo" "TipoContrato" NOT NULL DEFAULT 'RESIDENCIAL',
ADD COLUMN     "tipoGarantia" "TipoGarantia" NOT NULL;

-- CreateTable
CREATE TABLE "documentos_contrato" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documentos_contrato_contratoId_idx" ON "documentos_contrato"("contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_codigo_key" ON "contratos"("codigo");

-- AddForeignKey
ALTER TABLE "documentos_contrato" ADD CONSTRAINT "documentos_contrato_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

