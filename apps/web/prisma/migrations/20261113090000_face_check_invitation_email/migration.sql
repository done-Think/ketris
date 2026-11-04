BEGIN;
CREATE UNIQUE INDEX "face_check_sessions_id_tenantId_key" ON "face_check_sessions"("id", "tenantId");
CREATE TABLE "face_check_invitation_emails" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseId" TEXT,
  "leaseExpiresAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "face_check_invitation_emails_sessionId_tenantId_fkey"
    FOREIGN KEY ("sessionId", "tenantId") REFERENCES "face_check_sessions"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "face_check_invitation_emails_status_check" CHECK ("status" IN ('PENDING', 'SENDING', 'SENT', 'CANCELLED')),
  CONSTRAINT "face_check_invitation_emails_attempts_check" CHECK ("attempts" >= 0),
  CONSTRAINT "face_check_invitation_emails_locale_check" CHECK ("locale" IN ('pt-BR', 'en-US', 'es-ES')),
  CONSTRAINT "face_check_invitation_emails_lease_check" CHECK (("leaseId" IS NULL) = ("leaseExpiresAt" IS NULL)),
  CONSTRAINT "face_check_invitation_emails_sending_check" CHECK (("status" = 'SENDING') = ("leaseId" IS NOT NULL)),
  CONSTRAINT "face_check_invitation_emails_sent_check" CHECK (("status" = 'SENT') = ("sentAt" IS NOT NULL))
);
CREATE UNIQUE INDEX "face_check_invitation_emails_sessionId_tokenHash_key" ON "face_check_invitation_emails"("sessionId", "tokenHash");
CREATE INDEX "face_check_invitation_emails_status_nextAttemptAt_idx" ON "face_check_invitation_emails"("status", "nextAttemptAt");
CREATE INDEX "face_check_invitation_emails_leaseExpiresAt_idx" ON "face_check_invitation_emails"("leaseExpiresAt");
COMMIT;
