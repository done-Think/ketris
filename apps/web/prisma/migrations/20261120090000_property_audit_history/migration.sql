CREATE TABLE "property_audit_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorName" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "changes" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_audit_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "property_audit_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "property_audit_events_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "properties"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "property_audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "property_audit_events_tenantId_propertyId_createdAt_id_idx" ON "property_audit_events"("tenantId", "propertyId", "createdAt", "id");
CREATE INDEX "property_audit_events_propertyId_idx" ON "property_audit_events"("propertyId");
CREATE INDEX "property_audit_events_actorUserId_idx" ON "property_audit_events"("actorUserId");
