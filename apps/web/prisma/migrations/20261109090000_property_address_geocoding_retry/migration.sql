BEGIN;

ALTER TABLE "property_addresses" ADD COLUMN "geocodingRetryAt" TIMESTAMP(3);

COMMIT;
