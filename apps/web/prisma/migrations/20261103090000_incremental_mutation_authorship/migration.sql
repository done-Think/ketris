-- Incremental authorship only. Never infer historical authors from ownership,
-- responsibility, createdAt, or the current administrator.
BEGIN;

ALTER TABLE "contacts"
  ADD COLUMN "updatedById" TEXT,
  ADD COLUMN "archivedById" TEXT;
ALTER TABLE "opportunities"
  ADD COLUMN "updatedById" TEXT,
  ADD COLUMN "archivedById" TEXT;
ALTER TABLE "maintenance_tickets" ADD COLUMN "updatedById" TEXT;

CREATE INDEX "contacts_updatedById_idx" ON "contacts"("updatedById");
CREATE INDEX "contacts_archivedById_idx" ON "contacts"("archivedById");
CREATE INDEX "opportunities_updatedById_idx" ON "opportunities"("updatedById");
CREATE INDEX "opportunities_archivedById_idx" ON "opportunities"("archivedById");
CREATE INDEX "maintenance_tickets_updatedById_idx" ON "maintenance_tickets"("updatedById");

ALTER TABLE "contacts" ADD CONSTRAINT "contacts_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_archivedById_fkey"
  FOREIGN KEY ("archivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_archivedById_fkey"
  FOREIGN KEY ("archivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
