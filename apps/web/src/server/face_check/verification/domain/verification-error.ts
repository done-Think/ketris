import { AppError } from '@server/shared/errors'
import type { CaptureIssue } from '@server/face_check/types/session.types'

import type { VerificationErrorCode } from '../../types/verification.types'

export class VerificationError extends AppError {
  constructor(
    code: VerificationErrorCode,
    public readonly reason: CaptureIssue | null = null,
  ) {
    super(code, {
      code,
      status:
        code === 'SESSION_NOT_FOUND' || code === 'EVIDENCE_NOT_FOUND'
          ? 404
          : code === 'SESSION_EXPIRED' || code === 'EVIDENCE_DELETED'
            ? 410
            : code.startsWith('ANALYSIS_')
              ? 503
              : 409,
    })
    this.name = 'VerificationError'
  }
}

export function analysisFailure(error: unknown): VerificationError {
  return error instanceof VerificationError && error.code.startsWith('ANALYSIS_')
    ? error
    : new VerificationError('ANALYSIS_UNAVAILABLE')
}
