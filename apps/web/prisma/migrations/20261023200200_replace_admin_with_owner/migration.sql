UPDATE "usuarios" SET "papel" = 'OWNER' WHERE "papel" = 'ADMIN';
UPDATE "chamados_manutencao" SET "concluidoPorPapel" = 'OWNER' WHERE "concluidoPorPapel" = 'ADMIN';

ALTER TYPE "PapelUsuario" RENAME TO "PapelUsuario_old";
CREATE TYPE "PapelUsuario" AS ENUM ('OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER');

ALTER TABLE "usuarios" ALTER COLUMN "papel" DROP DEFAULT;
ALTER TABLE "usuarios" ALTER COLUMN "papel" TYPE "PapelUsuario" USING ("papel"::text::"PapelUsuario");
ALTER TABLE "usuarios" ALTER COLUMN "papel" SET DEFAULT 'AGENT';
ALTER TABLE "chamados_manutencao" ALTER COLUMN "concluidoPorPapel" TYPE "PapelUsuario" USING ("concluidoPorPapel"::text::"PapelUsuario");

DROP TYPE "PapelUsuario_old";
