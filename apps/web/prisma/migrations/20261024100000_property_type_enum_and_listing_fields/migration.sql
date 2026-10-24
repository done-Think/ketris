-- CreateEnum
CREATE TYPE "TipoImovel" AS ENUM ('APARTAMENTO', 'CASA', 'STUDIO', 'COBERTURA', 'COMERCIAL', 'LOFT', 'OUTRO');

-- CreateEnum
CREATE TYPE "ComodidadeImovel" AS ENUM ('MOBILIADO', 'VARANDA_GOURMET', 'ACEITA_PETS', 'PORTARIA_24H');

-- AlterTable: normaliza tipos conhecidos e classifica valores desconhecidos como OUTRO
ALTER TABLE "imoveis" ADD COLUMN "tipo_enum" "TipoImovel";

UPDATE "imoveis"
SET "tipo_enum" = CASE lower(trim("tipo"))
  WHEN 'apartamento' THEN 'APARTAMENTO'::"TipoImovel"
  WHEN 'apartment' THEN 'APARTAMENTO'::"TipoImovel"
  WHEN 'casa' THEN 'CASA'::"TipoImovel"
  WHEN 'house' THEN 'CASA'::"TipoImovel"
  WHEN 'studio' THEN 'STUDIO'::"TipoImovel"
  WHEN 'cobertura' THEN 'COBERTURA'::"TipoImovel"
  WHEN 'penthouse' THEN 'COBERTURA'::"TipoImovel"
  WHEN 'comercial' THEN 'COMERCIAL'::"TipoImovel"
  WHEN 'commercial' THEN 'COMERCIAL'::"TipoImovel"
  WHEN 'sala' THEN 'COMERCIAL'::"TipoImovel"
  WHEN 'loft' THEN 'LOFT'::"TipoImovel"
  ELSE 'OUTRO'::"TipoImovel"
END;

ALTER TABLE "imoveis" DROP COLUMN "tipo";
ALTER TABLE "imoveis" RENAME COLUMN "tipo_enum" TO "tipo";
ALTER TABLE "imoveis" ALTER COLUMN "tipo" SET NOT NULL;

ALTER TABLE "imoveis" ADD COLUMN "comodidades" "ComodidadeImovel"[] DEFAULT ARRAY[]::"ComodidadeImovel"[],
ADD COLUMN "condicoesNegociacao" TEXT,
ADD COLUMN "destaque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "permiteContatoWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicarAposRevisao" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "enderecos" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "midias" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "enderecos" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "midias" ALTER COLUMN "updatedAt" DROP DEFAULT;
