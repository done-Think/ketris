BEGIN;

ALTER TABLE "properties" ADD COLUMN "ownerContactId" TEXT;

CREATE UNIQUE INDEX "contacts_id_tenantId_key" ON "contacts"("id", "tenantId");
CREATE INDEX "properties_tenantId_ownerContactId_idx" ON "properties"("tenantId", "ownerContactId");

ALTER TABLE "properties" ADD CONSTRAINT "properties_ownerContactId_tenantId_fkey"
  FOREIGN KEY ("ownerContactId", "tenantId") REFERENCES "contacts"("id", "tenantId")
  ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT;
