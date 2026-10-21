ALTER TABLE "partes_contrato" ADD COLUMN "usuarioId" TEXT;

CREATE INDEX "partes_contrato_usuarioId_idx" ON "partes_contrato"("usuarioId");

ALTER TABLE "partes_contrato" ADD CONSTRAINT "partes_contrato_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
