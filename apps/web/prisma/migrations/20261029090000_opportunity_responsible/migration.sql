ALTER TABLE "oportunidades" ADD COLUMN "responsavelId" TEXT;

UPDATE "oportunidades" o
SET "responsavelId" = i."responsavelId"
FROM "imoveis" i
WHERE i."id" = o."imovelId";

ALTER TABLE "oportunidades" ALTER COLUMN "responsavelId" SET NOT NULL;

CREATE INDEX "oportunidades_tenantId_responsavelId_idx" ON "oportunidades"("tenantId", "responsavelId");

ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_responsavelId_tenantId_fkey" FOREIGN KEY ("responsavelId", "tenantId") REFERENCES "usuarios"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transferencias_carteira" ADD COLUMN "oportunidadeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
