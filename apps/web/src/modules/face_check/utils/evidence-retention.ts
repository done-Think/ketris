import type { VerificationSession } from '../types'

export function evidenceReviewKey(
  session: Pick<VerificationSession, 'id' | 'attemptsUsed' | 'timeline'>,
) {
  const consent = session.timeline.filter((event) => event.kind === 'consented').at(-1)
  return `${session.id}:${session.attemptsUsed}:${consent?.id ?? ''}`
}

export function areEvidenceImagesDeleted(
  session: Pick<VerificationSession, 'status' | 'evidenceDeletedAt' | 'evidenceExpiresAt'>,
  now = Date.now(),
) {
  if (session.evidenceDeletedAt || session.status === 'APPROVED' || session.status === 'REJECTED')
    return true
  return Boolean(session.evidenceExpiresAt && new Date(session.evidenceExpiresAt).getTime() <= now)
}
