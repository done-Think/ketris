import type { VerificationDependencies } from '../../../types/verification.types'
import type { DeferredLivenessPlan } from '../../../types/face-match.types'
import { ensureInProgress, livenessPool, syncEvidence } from '../../domain/session-rules'
import { VerificationError } from '../../domain/verification-error'
import { changeSession } from '../session-access'

export function prepareLivenessUseCase(deps: VerificationDependencies) {
  return {
    execute: (token: string, restart = false): Promise<DeferredLivenessPlan> =>
      changeSession(deps, { token }, (record) => {
        ensureInProgress(record.session)
        if (record.session.captureMode !== 'camera')
          throw new VerificationError('INVALID_CAPTURE_STATE')
        if (!deps.faceEngine) throw new VerificationError('ANALYSIS_UNAVAILABLE')
        if (!record.capture.plan || restart) {
          record.capture.plan = { id: deps.newId(), expiresAt: record.session.captureDeadline! }
          record.capture.photos = {}
          record.capture.documentReadings = {}
          record.capture.challenges = null
          record.capture.livenessVerified = false
          record.capture.liveScore = null
          record.session.documentCheck = null
          syncEvidence(record)
        }
        // Preparing an offline capture never extends the consent window or resets rejection limits.
        return {
          planId: record.capture.plan.id,
          expiresAt: record.capture.plan.expiresAt,
          challenges: [...livenessPool],
          step: record.capture.livenessVerified
            ? livenessPool.length
            : (record.capture.challenges?.step ?? 0),
        }
      }),
  }
}
