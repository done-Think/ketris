UPDATE "usuarios"
SET "papel" = 'PROPERTY_OWNER'
WHERE "papel" = 'OWNER'
  AND "id" IN (SELECT DISTINCT "proprietarioId" FROM "imoveis" WHERE "proprietarioId" IS NOT NULL);
