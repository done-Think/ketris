BEGIN;

-- Existing profiles keep inheriting the tenant palette until their own colors are saved.
-- Application rollback is compatible with these nullable columns; retain them to preserve saved colors.
ALTER TABLE "agency_public_profiles"
  ADD COLUMN "primaryColor" TEXT,
  ADD COLUMN "secondaryColor" TEXT;

COMMIT;
