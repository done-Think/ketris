-- DropForeignKey
ALTER TABLE "contratos" DROP CONSTRAINT "contratos_imovelId_fkey";

-- DropForeignKey
ALTER TABLE "oportunidades" DROP CONSTRAINT "oportunidades_imovelId_fkey";

-- AddForeignKey
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
