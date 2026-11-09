BEGIN;

-- Additive registry shared by brokers and agencies. Existing public URLs remain valid.
-- Application rollback can retain this table to preserve chosen addresses.
CREATE TABLE "public_profile_addresses" (
  "handle" TEXT NOT NULL,
  "brokerUserId" TEXT,
  "agencyTenantId" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "public_profile_addresses_pkey" PRIMARY KEY ("handle"),
  CONSTRAINT "public_profile_addresses_target_check" CHECK (("brokerUserId" IS NOT NULL) <> ("agencyTenantId" IS NOT NULL)),
  CONSTRAINT "public_profile_addresses_handle_check" CHECK (char_length("handle") BETWEEN 3 AND 40 AND "handle" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT "public_profile_addresses_brokerUserId_fkey" FOREIGN KEY ("brokerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "public_profile_addresses_agencyTenantId_fkey" FOREIGN KEY ("agencyTenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "public_profile_addresses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "public_profile_addresses_brokerUserId_key" ON "public_profile_addresses"("brokerUserId");
CREATE UNIQUE INDEX "public_profile_addresses_agencyTenantId_key" ON "public_profile_addresses"("agencyTenantId");
CREATE INDEX "public_profile_addresses_updatedById_idx" ON "public_profile_addresses"("updatedById");

COMMIT;
