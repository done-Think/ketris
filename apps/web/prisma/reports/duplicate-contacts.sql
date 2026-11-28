-- Accounts that share a phone, CRECI or CPF inside the same tenant. The unique-contacts migration
-- keeps only the oldest one keyed; the others stay unconstrained until someone resolves them.
-- Run with: psql "$DATABASE_URL" -f prisma/reports/duplicate-contacts.sql
SELECT 'phone' AS field, "tenantId", regexp_replace("phone", '\D', '', 'g') AS value,
       count(*) AS accounts, array_agg("email" ORDER BY "createdAt") AS emails
FROM "users"
WHERE "phone" IS NOT NULL AND regexp_replace("phone", '\D', '', 'g') <> ''
GROUP BY "tenantId", regexp_replace("phone", '\D', '', 'g')
HAVING count(*) > 1
UNION ALL
SELECT 'creci', "tenantId", upper(regexp_replace("creci", '[^A-Za-z0-9]', '', 'g')),
       count(*), array_agg("email" ORDER BY "createdAt")
FROM "users"
WHERE "creci" IS NOT NULL AND regexp_replace("creci", '[^A-Za-z0-9]', '', 'g') <> ''
GROUP BY "tenantId", upper(regexp_replace("creci", '[^A-Za-z0-9]', '', 'g'))
HAVING count(*) > 1
ORDER BY 1, 2;
