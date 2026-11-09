import type { SessionRecord, VerificationDependencies } from '../../../types/verification.types'
import { ensureInProgress, livenessStepWindowMs } from '../../domain/session-rules'
import { analysisFailure, VerificationError } from '../../domain/verification-error'
import { readSession } from '../session-access'

function ensureProximityStep(record: SessionRecord, now: number) {
  const { session, capture } = record
  if (now >= Date.parse(session.expiresAt)) throw new VerificationError('SESSION_EXPIRED')
  ensureInProgress(session)
  const issued = capture.challenges
  if (
    session.captureMode !== 'camera' ||
    (session.captureDeadline !== null && now >= Date.parse(session.captureDeadline)) ||
    !issued ||
    issued.challenges[issued.step] !== 'closer' ||
    now - issued.checkpointAt > livenessStepWindowMs
  )
    throw new VerificationError('INVALID_CAPTURE_STATE')
  if (!capture.photos.selfie) throw new VerificationError('IMAGE_REQUIRED')
  return { selfie: capture.photos.selfie, issued }
}

export function livenessProximityUseCase(deps: VerificationDependencies) {
  return {
    execute: async (token: string, image: Uint8Array) => {
      const record = await readSession(deps, { token })
      const { selfie, issued } = ensureProximityStep(record, deps.clock())
      if (!deps.faceEngine?.proximity) throw new VerificationError('ANALYSIS_UNAVAILABLE')
      const stored = await deps.photos.load(record.session.id, selfie.evidenceId)
      if (!stored) throw new VerificationError('IMAGE_REQUIRED')
      let result
      try {
        result = await deps.faceEngine.proximity(stored.bytes, image)
      } catch (error) {
        throw analysisFailure(error)
      }
      const latest = ensureProximityStep(await readSession(deps, { token }), deps.clock())
      if (
        latest.selfie.evidenceId !== selfie.evidenceId ||
        latest.issued.step !== issued.step ||
        latest.issued.checkpointAt !== issued.checkpointAt
      )
        throw new VerificationError('INVALID_CAPTURE_STATE')
      return result
    },
  }
}
