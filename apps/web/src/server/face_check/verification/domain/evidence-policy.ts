import type { VerificationSession } from '../../types/session.types'
import { VerificationError } from './verification-error'

export const maximumEvidenceRetentionMs = 7 * 24 * 60 * 60 * 1000
// The hourly cleanup job needs a scheduling margin. Access expires after 6d23h,
// leaving one hour for the normal scheduled deletion before the seven-day maximum.
// Failed or delayed jobs remain visible in the retry queue and require monitoring.
export const evidencePurgeSchedulingMarginMs = 60 * 60 * 1000
export const evidenceRetentionMs = maximumEvidenceRetentionMs - evidencePurgeSchedulingMarginMs

export function evidenceUnavailable(session: VerificationSession, now = Date.now()) {
  return (
    ['APPROVED', 'REJECTED'].includes(session.status) ||
    !!session.evidencePurgePending ||
    !!session.evidenceDeletedAt ||
    (session.evidenceExpiresAt != null && Date.parse(session.evidenceExpiresAt) <= now)
  )
}

export function ensureEvidenceAvailable(session: VerificationSession, now = Date.now()) {
  if (evidenceUnavailable(session, now)) throw new VerificationError('EVIDENCE_DELETED')
}

export function manualOverrideAllowed(session: VerificationSession, now = Date.now()) {
  if (session.status !== 'REVIEW' || evidenceUnavailable(session, now)) return false
  const attempt =
    session.captureAttempt ??
    (session.submittedAt ? session.attemptsUsed : session.attemptsUsed + 1)
  return ['front', 'back', 'selfie'].every((step) =>
    session.evidenceHistory.some(
      (evidence) =>
        evidence.step === step &&
        evidence.attempt === attempt &&
        !evidence.deletedAt &&
        evidence.stored !== false,
    ),
  )
}
