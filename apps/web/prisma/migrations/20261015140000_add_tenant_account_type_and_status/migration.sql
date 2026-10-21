CREATE TYPE "TenantAccountType" AS ENUM ('INDIVIDUAL', 'BROKER', 'AGENCY');

CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED');

-- Existing tenants start as active agencies; a platform admin adjusts the type when needed.
ALTER TABLE "tenants"
ADD COLUMN "accountType" "TenantAccountType" NOT NULL DEFAULT 'AGENCY',
ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "canceledAt" TIMESTAMP(3);
