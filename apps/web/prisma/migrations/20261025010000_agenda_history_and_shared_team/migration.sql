BEGIN;
ALTER TYPE "DestinoEventoAgenda" RENAME VALUE 'LEGACY_TEAM' TO 'SHARED_TEAM';
ALTER TABLE "eventos_agenda" ADD COLUMN "canceladoEm" TIMESTAMP(3), ADD COLUMN "canceladoPorId" TEXT, ADD COLUMN "motivoCancelamento" TEXT;
ALTER TABLE "eventos_agenda" DROP CONSTRAINT "eventos_agenda_responsavelId_fkey";
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "eventos_agenda" ADD CONSTRAINT "eventos_agenda_canceladoPorId_fkey" FOREIGN KEY ("canceladoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "eventos_agenda_id_tenantId_key" ON "eventos_agenda"("id", "tenantId");
CREATE TYPE "AgendaAuditAction" AS ENUM ('CREATED', 'UPDATED', 'RESCHEDULED', 'CANCELLED');
CREATE TABLE "agenda_event_audit" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" "AgendaAuditAction" NOT NULL,
  "changedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agenda_event_audit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "agenda_event_audit_tenantId_eventId_createdAt_idx" ON "agenda_event_audit"("tenantId", "eventId", "createdAt");
CREATE INDEX "agenda_event_audit_actorUserId_idx" ON "agenda_event_audit"("actorUserId");
ALTER TABLE "agenda_event_audit" ADD CONSTRAINT "agenda_event_audit_eventId_tenantId_fkey" FOREIGN KEY ("eventId", "tenantId") REFERENCES "eventos_agenda"("id", "tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agenda_event_audit" ADD CONSTRAINT "agenda_event_audit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;
