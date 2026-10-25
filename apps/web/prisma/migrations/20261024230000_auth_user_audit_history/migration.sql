BEGIN;
CREATE TYPE "UserAuditAction" AS ENUM ('CREATED', 'UPDATED', 'MEMBERSHIP_APPROVED', 'DEACTIVATED');
CREATE TYPE "UserAuditActorType" AS ENUM ('USER', 'PLATFORM_ADMIN', 'SELF_REGISTRATION', 'SYSTEM');
CREATE TABLE "auth_user_audit_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" "UserAuditAction" NOT NULL,
  "actorType" "UserAuditActorType" NOT NULL,
  "actorUserId" TEXT,
  "actorPlatformAdminId" TEXT,
  "changedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_user_audit_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "auth_user_audit_events_tenantId_userId_createdAt_idx" ON "auth_user_audit_events"("tenantId", "userId", "createdAt");
CREATE INDEX "auth_user_audit_events_actorUserId_idx" ON "auth_user_audit_events"("actorUserId");
CREATE INDEX "auth_user_audit_events_actorPlatformAdminId_idx" ON "auth_user_audit_events"("actorPlatformAdminId");
ALTER TABLE "auth_user_audit_events" ADD CONSTRAINT "auth_user_audit_events_userId_tenantId_fkey" FOREIGN KEY ("userId", "tenantId") REFERENCES "usuarios"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_user_audit_events" ADD CONSTRAINT "auth_user_audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "auth_user_audit_events" ADD CONSTRAINT "auth_user_audit_events_actorPlatformAdminId_fkey" FOREIGN KEY ("actorPlatformAdminId") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;
