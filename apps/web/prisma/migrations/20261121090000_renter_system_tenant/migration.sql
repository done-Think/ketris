-- The renters' system tenant ("locatarios") is required by renter registration
-- (RENTER_TENANT_SLUG). Without it, sign-up fails with 503 RENTER_TENANT_NOT_CONFIGURED.
-- It is infrastructure, not demo data, so it ships with the schema instead of db:seed.
-- Idempotent: existing databases keep their tenant untouched.
INSERT INTO "tenants" ("id", "name", "slug", "updatedAt")
VALUES ('system-tenant-locatarios', 'Locatários Ketris', 'locatarios', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
