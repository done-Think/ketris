-- Phone, CRECI and CPF are unique inside a tenant (like the e-mail); a CNPJ is unique across tenants.
ALTER TABLE "users" ADD COLUMN "phoneKey" TEXT;
ALTER TABLE "users" ADD COLUMN "creciKey" TEXT;
ALTER TABLE "users" ADD COLUMN "cpf" TEXT;
ALTER TABLE "tenants" ADD COLUMN "cnpj" TEXT;

-- Backfill without losing data: only the oldest account per tenant and value is keyed, so existing
-- duplicates stay unkeyed (and unconstrained) until someone resolves them.
WITH keyed AS (
  SELECT "id",
         regexp_replace("phone", '\D', '', 'g') AS "key",
         row_number() OVER (
           PARTITION BY "tenantId", regexp_replace("phone", '\D', '', 'g')
           ORDER BY "createdAt", "id"
         ) AS "position"
  FROM "users"
  WHERE "phone" IS NOT NULL AND regexp_replace("phone", '\D', '', 'g') <> ''
)
UPDATE "users" SET "phoneKey" = keyed."key" FROM keyed WHERE "users"."id" = keyed."id" AND keyed."position" = 1;

WITH keyed AS (
  SELECT "id",
         upper(regexp_replace("creci", '[^A-Za-z0-9]', '', 'g')) AS "key",
         row_number() OVER (
           PARTITION BY "tenantId", upper(regexp_replace("creci", '[^A-Za-z0-9]', '', 'g'))
           ORDER BY "createdAt", "id"
         ) AS "position"
  FROM "users"
  WHERE "creci" IS NOT NULL AND regexp_replace("creci", '[^A-Za-z0-9]', '', 'g') <> ''
)
UPDATE "users" SET "creciKey" = keyed."key" FROM keyed WHERE "users"."id" = keyed."id" AND keyed."position" = 1;

CREATE UNIQUE INDEX "users_tenantId_phoneKey_key" ON "users"("tenantId", "phoneKey");
CREATE UNIQUE INDEX "users_tenantId_creciKey_key" ON "users"("tenantId", "creciKey");
CREATE UNIQUE INDEX "users_tenantId_cpf_key" ON "users"("tenantId", "cpf");
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");
