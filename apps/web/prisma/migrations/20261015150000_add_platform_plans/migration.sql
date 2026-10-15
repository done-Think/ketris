CREATE TABLE "platform_plans" (
    "accountType" "TenantAccountType" NOT NULL,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "includedUnits" INTEGER NOT NULL,
    "extraUnitPrice" DECIMAL(12,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_plans_pkey" PRIMARY KEY ("accountType")
);

-- Initial price list agreed with product. Platform admins edit it on the Plans page.
-- Individuals and brokers: up to 10 properties included, R$ 9,99 per extra property.
-- Agencies: up to 10 active brokers included, R$ 19,99 per extra broker.
INSERT INTO "platform_plans" ("accountType", "monthlyPrice", "includedUnits", "extraUnitPrice", "updatedAt") VALUES
    ('INDIVIDUAL', 49.99, 10, 9.99, CURRENT_TIMESTAMP),
    ('BROKER', 99.99, 10, 9.99, CURRENT_TIMESTAMP),
    ('AGENCY', 199.99, 10, 19.99, CURRENT_TIMESTAMP);
