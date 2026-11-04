BEGIN;
-- No backfill: existing encrypted contacts are not inspected or inferred by this migration.
ALTER TABLE "face_check_sessions" ADD COLUMN "candidateUserId" TEXT;
ALTER TABLE "face_check_sessions" ADD CONSTRAINT "face_check_sessions_candidateUserId_fkey"
  FOREIGN KEY ("candidateUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "face_check_sessions_candidateUserId_createdAt_idx"
  ON "face_check_sessions"("candidateUserId", "createdAt");
COMMIT;
