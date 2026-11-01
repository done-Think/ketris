import type { SessionStatus, StatusTone } from '../types/session.types'

export const statusTone: Record<SessionStatus, StatusTone> = {
  CREATED: 'neutral',
  IN_PROGRESS: 'info',
  SUBMITTED: 'info',
  PROCESSING: 'info',
  RESUBMISSION_REQUESTED: 'redo',
  REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  EXPIRED: 'neutral',
  ABANDONED: 'neutral',
}

export const finalCaptureStatuses: SessionStatus[] = [
  'APPROVED',
  'REVIEW',
  'REJECTED',
  'RESUBMISSION_REQUESTED',
  'EXPIRED',
  'ABANDONED',
]

export function isCaptureInFlight(status: SessionStatus) {
  return status === 'SUBMITTED' || status === 'PROCESSING'
}
