CREATE TABLE "property_broker_access" (
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_broker_access_pkey" PRIMARY KEY ("propertyId", "userId"),
  CONSTRAINT "property_broker_access_propertyId_tenantId_fkey"
    FOREIGN KEY ("propertyId", "tenantId") REFERENCES "properties"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "property_broker_access_userId_tenantId_fkey"
    FOREIGN KEY ("userId", "tenantId") REFERENCES "users"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "property_broker_access_tenantId_userId_idx" ON "property_broker_access"("tenantId", "userId");
