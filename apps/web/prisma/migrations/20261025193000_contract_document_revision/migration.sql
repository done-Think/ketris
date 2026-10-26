BEGIN;

ALTER TABLE "contratos" ADD COLUMN "revisaoDados" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "documentos_contrato" ADD COLUMN "revisaoContrato" INTEGER;

COMMIT;
