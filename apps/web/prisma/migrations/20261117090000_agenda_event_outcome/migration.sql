CREATE TYPE "AgendaVisitInterest" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

ALTER TYPE "AgendaEventStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "AgendaEventStatus" ADD VALUE 'NO_SHOW';

ALTER TYPE "AgendaAuditAction" ADD VALUE 'COMPLETED';
ALTER TYPE "AgendaAuditAction" ADD VALUE 'NO_SHOW';

ALTER TABLE "agenda_events" ADD COLUMN "outcomeRecordedAt" TIMESTAMP(3),
ADD COLUMN "outcomeRecordedById" TEXT,
ADD COLUMN "visitInterest" "AgendaVisitInterest",
ADD COLUMN "outcomeNotes" TEXT;

CREATE INDEX "agenda_events_outcomeRecordedById_idx" ON "agenda_events"("outcomeRecordedById");

ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_outcomeRecordedById_fkey" FOREIGN KEY ("outcomeRecordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
