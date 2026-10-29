BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "property_media"
    WHERE lower("type") NOT IN ('foto', 'photo', 'image', 'imagem', 'video', 'vídeo', 'planta', 'floor_plan', 'floorplan')
  ) THEN
    RAISE EXCEPTION 'Unsupported property media type; review existing values before migrating';
  END IF;
END $$;

CREATE TYPE "PropertyMediaType" AS ENUM ('PHOTO', 'VIDEO', 'FLOOR_PLAN');
ALTER TABLE "property_media" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "property_media" ALTER COLUMN "type" TYPE "PropertyMediaType"
USING (CASE
  WHEN lower("type") IN ('video', 'vídeo') THEN 'VIDEO'
  WHEN lower("type") IN ('planta', 'floor_plan', 'floorplan') THEN 'FLOOR_PLAN'
  ELSE 'PHOTO'
END)::"PropertyMediaType";
ALTER TABLE "property_media" ALTER COLUMN "type" SET DEFAULT 'PHOTO';

ALTER TABLE "property_addresses" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "property_media" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "contract_parties" ADD COLUMN "tenantId" TEXT;

UPDATE "property_addresses" child SET "tenantId" = parent."tenantId"
FROM "properties" parent WHERE child."propertyId" = parent.id;
UPDATE "property_media" child SET "tenantId" = parent."tenantId"
FROM "properties" parent WHERE child."propertyId" = parent.id;
UPDATE "contract_parties" child SET "tenantId" = parent."tenantId"
FROM "contracts" parent WHERE child."contractId" = parent.id;

ALTER TABLE "property_addresses" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "property_media" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "contract_parties" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE UNIQUE INDEX "properties_id_tenantId_key" ON "properties"("id", "tenantId");
CREATE UNIQUE INDEX "property_addresses_propertyId_tenantId_key" ON "property_addresses"("propertyId", "tenantId");
CREATE INDEX "property_addresses_tenantId_idx" ON "property_addresses"("tenantId");
CREATE INDEX "property_media_tenantId_idx" ON "property_media"("tenantId");
CREATE INDEX "contract_parties_tenantId_idx" ON "contract_parties"("tenantId");

ALTER TABLE "property_addresses" DROP CONSTRAINT "property_addresses_propertyId_fkey";
ALTER TABLE "property_media" DROP CONSTRAINT "property_media_propertyId_fkey";
ALTER TABLE "contract_parties" DROP CONSTRAINT "contract_parties_contractId_fkey";
ALTER TABLE "property_addresses" ADD CONSTRAINT "property_addresses_propertyId_tenantId_fkey"
FOREIGN KEY ("propertyId", "tenantId") REFERENCES "properties"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_propertyId_tenantId_fkey"
FOREIGN KEY ("propertyId", "tenantId") REFERENCES "properties"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_parties" ADD CONSTRAINT "contract_parties_contractId_tenantId_fkey"
FOREIGN KEY ("contractId", "tenantId") REFERENCES "contracts"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "contract_parties" party
SET "createdAt" = COALESCE(party."createdAt", contract."createdAt"),
    "updatedAt" = COALESCE(party."updatedAt", party."createdAt", contract."createdAt")
FROM "contracts" contract WHERE party."contractId" = contract.id
AND (party."createdAt" IS NULL OR party."updatedAt" IS NULL);
UPDATE "contract_signatures" signature
SET "createdAt" = COALESCE(signature."createdAt", signature."signedAt", party."createdAt"),
    "updatedAt" = COALESCE(signature."updatedAt", signature."signedAt", signature."createdAt", party."createdAt")
FROM "contract_parties" party WHERE signature."contractPartyId" = party.id
AND (signature."createdAt" IS NULL OR signature."updatedAt" IS NULL);
ALTER TABLE "contract_parties" ALTER COLUMN "createdAt" SET NOT NULL, ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "contract_signatures" ALTER COLUMN "createdAt" SET NOT NULL, ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "agency_profile_highlights" ADD COLUMN "createdAt" TIMESTAMP(3), ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "agency_profile_highlights" child
SET "createdAt" = parent."createdAt", "updatedAt" = parent."createdAt"
FROM "agency_public_profiles" parent WHERE child."profileId" = parent.id;
ALTER TABLE "agency_profile_highlights"
ALTER COLUMN "createdAt" SET NOT NULL, ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

COMMIT;
