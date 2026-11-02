import type { VerificationDependencies } from '../../../types/verification.types'
import type { LivenessSequenceState } from '../../../types/face-match.types'
import { ensureInProgress, livenessPool } from '../../domain/session-rules'
import { VerificationError } from '../../domain/verification-error'
import { issueChallenges } from '../capture-steps'
import { changeSession } from '../session-access'
import { requireCapturePlan } from '../capture-plan'

export function startLivenessUseCase(deps: VerificationDependencies) {
  return {
    execute: (token: string, planId?: string): Promise<LivenessSequenceState> =>
      changeSession(deps, { token }, (record) => {
        ensureInProgress(record.session)
        requireCapturePlan(record, planId)
        if (record.session.captureMode !== 'camera' || !record.capture.photos.selfie)
          throw new VerificationError('INVALID_CAPTURE_STATE')
        if (record.capture.livenessVerified)
          return { challenges: [...livenessPool], step: livenessPool.length }
        if (!deps.faceEngine) throw new VerificationError('ANALYSIS_UNAVAILABLE')
        const issued = record.capture.challenges ?? issueChallenges(deps, record)
        // Starting/resuming refreshes only the current movement window, never completed steps
        // or the overall capture deadline. Every frame is still verified server-side.
        issued.checkpointAt = deps.clock()
        return { challenges: [...issued.challenges], step: issued.step }
      }),
  }
}
