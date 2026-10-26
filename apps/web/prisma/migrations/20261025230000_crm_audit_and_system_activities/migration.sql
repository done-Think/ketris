ALTER TABLE "atividades_oportunidade" ADD COLUMN "systemAction" TEXT;
CREATE TABLE "crm_audit_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorRole" "PapelUsuario" NOT NULL,
  "action" TEXT NOT NULL,
  "changedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "crm_audit_events_tenantId_entityType_entityId_createdAt_idx" ON "crm_audit_events"("tenantId", "entityType", "entityId", "createdAt");
ALTER TABLE "crm_audit_events" ADD CONSTRAINT "crm_audit_events_tenantId_fkey"
 FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
