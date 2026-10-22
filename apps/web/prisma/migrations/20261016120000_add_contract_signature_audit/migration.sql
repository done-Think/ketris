-- AlterTable
ALTER TABLE "assinaturas" ADD COLUMN "assinadaPorId" TEXT;

-- AlterTable
ALTER TABLE "contratos" ADD COLUMN "ativadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_ativadoPorId_fkey" FOREIGN KEY ("ativadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_assinadaPorId_fkey" FOREIGN KEY ("assinadaPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
