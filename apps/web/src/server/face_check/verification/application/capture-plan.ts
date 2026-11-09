import type { SessionRecord } from '../../types/verification.types'
import { VerificationError } from '../domain/verification-error'

export function requireCapturePlan(record: SessionRecord, planId?: string) {
  if (record.capture.plan ? record.capture.plan.id !== planId : planId !== undefined)
    throw new VerificationError('INVALID_CAPTURE_STATE')
}
