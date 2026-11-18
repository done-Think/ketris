CREATE UNIQUE INDEX "leads_id_tenantId_key" ON "leads"("id", "tenantId");

CREATE TABLE "lead_broker_access" (
  "tenantId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_broker_access_pkey" PRIMARY KEY ("leadId", "userId"),
  CONSTRAINT "lead_broker_access_leadId_tenantId_fkey"
    FOREIGN KEY ("leadId", "tenantId") REFERENCES "leads"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "lead_broker_access_userId_tenantId_fkey"
    FOREIGN KEY ("userId", "tenantId") REFERENCES "users"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "lead_broker_access_tenantId_userId_idx" ON "lead_broker_access"("tenantId", "userId");

CREATE UNIQUE INDEX "opportunities_id_tenantId_key" ON "opportunities"("id", "tenantId");

CREATE TABLE "opportunity_broker_access" (
  "tenantId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "opportunity_broker_access_pkey" PRIMARY KEY ("opportunityId", "userId"),
  CONSTRAINT "opportunity_broker_access_opportunityId_tenantId_fkey"
    FOREIGN KEY ("opportunityId", "tenantId") REFERENCES "opportunities"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "opportunity_broker_access_userId_tenantId_fkey"
    FOREIGN KEY ("userId", "tenantId") REFERENCES "users"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "opportunity_broker_access_tenantId_userId_idx" ON "opportunity_broker_access"("tenantId", "userId");

