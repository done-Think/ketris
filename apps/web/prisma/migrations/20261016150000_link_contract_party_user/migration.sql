-- The maintenance migration also introduces this relation. Preserve existing links when
-- both histories are applied, and still support databases where this migration runs first.
ALTER TABLE "partes_contrato" ADD COLUMN IF NOT EXISTS "usuarioId" TEXT;

CREATE INDEX IF NOT EXISTS "partes_contrato_usuarioId_idx" ON "partes_contrato"("usuarioId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partes_contrato_usuarioId_fkey'
      AND conrelid = '"partes_contrato"'::regclass
  ) THEN
    ALTER TABLE "partes_contrato" ADD CONSTRAINT "partes_contrato_usuarioId_fkey"
      FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
