BEGIN;
CREATE TABLE "face_check_sessions" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "encryptedRecord" TEXT NOT NULL,
  "leaseId" TEXT,
  "leaseExpiresAt" TIMESTAMP(3),
  "evidenceExpiresAt" TIMESTAMP(3),
  "evidenceDeletedAt" TIMESTAMP(3),
  "evidencePurgePending" BOOLEAN NOT NULL DEFAULT false,
  "evidencePurgeAttempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "face_check_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "face_check_sessions_propertyId_tenantId_fkey" FOREIGN KEY ("propertyId", "tenantId") REFERENCES "properties"("id", "tenantId") ON DELETE CASCADE,
  CONSTRAINT "face_check_sessions_requestedById_tenantId_fkey" FOREIGN KEY ("requestedById", "tenantId") REFERENCES "users"("id", "tenantId") ON DELETE NO ACTION,
  CONSTRAINT "face_check_sessions_revision_check" CHECK ("revision" >= 0),
  CONSTRAINT "face_check_sessions_lease_check" CHECK (("leaseId" IS NULL) = ("leaseExpiresAt" IS NULL))
);
CREATE UNIQUE INDEX "face_check_sessions_tokenHash_key" ON "face_check_sessions"("tokenHash");
CREATE INDEX "face_check_sessions_tenantId_status_createdAt_idx" ON "face_check_sessions"("tenantId", "status", "createdAt");
CREATE INDEX "face_check_sessions_tenantId_propertyId_idx" ON "face_check_sessions"("tenantId", "propertyId");
CREATE INDEX "face_check_sessions_requestedById_tenantId_idx" ON "face_check_sessions"("requestedById", "tenantId");
CREATE INDEX "face_check_sessions_expiresAt_idx" ON "face_check_sessions"("expiresAt");
CREATE INDEX "face_check_sessions_evidencePurgePending_evidenceExpiresAt_idx" ON "face_check_sessions"("evidencePurgePending", "evidenceExpiresAt");
CREATE TABLE "face_check_settings" (
  "tenantId" TEXT PRIMARY KEY,
  "encryptedRecord" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "face_check_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);
CREATE TABLE "face_check_rate_limits" (
  "key" TEXT PRIMARY KEY,
  "tenantId" TEXT,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "face_check_rate_limits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);
CREATE INDEX "face_check_rate_limits_expiresAt_idx" ON "face_check_rate_limits"("expiresAt");
COMMIT;
