BEGIN;

ALTER TABLE "leads" ADD COLUMN "propertyId" TEXT;

UPDATE "leads" AS l
SET "propertyId" = o."propertyId"
FROM "opportunities" AS o
WHERE l."opportunityId" = o."id" AND l."tenantId" = o."tenantId";

CREATE INDEX "leads_tenantId_propertyId_idx" ON "leads"("tenantId", "propertyId");

ALTER TABLE "leads" ADD CONSTRAINT "leads_propertyId_tenantId_fkey"
FOREIGN KEY ("propertyId", "tenantId") REFERENCES "properties"("id", "tenantId")
ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT;
