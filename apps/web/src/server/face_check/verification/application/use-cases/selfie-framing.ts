import type { SessionRecord, VerificationDependencies } from '../../../types/verification.types'
import { ensureInProgress } from '../../domain/session-rules'
import { analysisFailure, VerificationError } from '../../domain/verification-error'
import { readSession } from '../session-access'

function ensureFramingStep(record: SessionRecord, now: number) {
  const { session, capture } = record
  if (now >= Date.parse(session.expiresAt)) throw new VerificationError('SESSION_EXPIRED')
  ensureInProgress(session)
  if (
    session.captureMode !== 'camera' ||
    session.status !== 'IN_PROGRESS' ||
    session.captureDeadline === null ||
    now >= Date.parse(session.captureDeadline)
  )
    throw new VerificationError('INVALID_CAPTURE_STATE')
  if (!capture.photos.front || !capture.photos.back) throw new VerificationError('IMAGE_REQUIRED')
  return [capture.photos.front.evidenceId, capture.photos.back.evidenceId] as const
}

export function selfieFramingUseCase(deps: VerificationDependencies) {
  return {
    execute: async (token: string, image: Uint8Array) => {
      const record = await readSession(deps, { token })
      const references = ensureFramingStep(record, deps.clock())
      if (!deps.faceEngine?.framing) throw new VerificationError('ANALYSIS_UNAVAILABLE')
      let result
      try {
        result = await deps.faceEngine.framing(image)
      } catch (error) {
        throw analysisFailure(error)
      }
      const latest = ensureFramingStep(await readSession(deps, { token }), deps.clock())
      if (latest.some((reference, index) => reference !== references[index]))
        throw new VerificationError('INVALID_CAPTURE_STATE')
      return result
    },
  }
}
