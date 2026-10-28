-- Authorship for the remaining mutable business aggregates. Preserve unknown
-- historical authors and existing lifecycle semantics; do not create tombstones.
BEGIN;

ALTER TABLE "properties" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "leads" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "broker_public_profiles" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "agency_public_profiles" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "contracts" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "agenda_events" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "charges" ADD COLUMN "updatedById" TEXT;

CREATE INDEX "properties_updatedById_idx" ON "properties"("updatedById");
CREATE INDEX "leads_updatedById_idx" ON "leads"("updatedById");
CREATE INDEX "broker_public_profiles_updatedById_idx" ON "broker_public_profiles"("updatedById");
CREATE INDEX "agency_public_profiles_updatedById_idx" ON "agency_public_profiles"("updatedById");
CREATE INDEX "contracts_updatedById_idx" ON "contracts"("updatedById");
CREATE INDEX "agenda_events_updatedById_idx" ON "agenda_events"("updatedById");
CREATE INDEX "charges_updatedById_idx" ON "charges"("updatedById");

ALTER TABLE "properties" ADD CONSTRAINT "properties_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "broker_public_profiles" ADD CONSTRAINT "broker_public_profiles_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agency_public_profiles" ADD CONSTRAINT "agency_public_profiles_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "charges" ADD CONSTRAINT "charges_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
