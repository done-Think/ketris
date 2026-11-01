import type { VerificationDependencies } from '../../../types/verification.types'
import { ensureInProgress } from '../../domain/session-rules'
import { analysisFailure, VerificationError } from '../../domain/verification-error'
import { changeSession } from '../session-access'

export function documentRegionsUseCase(deps: VerificationDependencies) {
  return {
    execute: async (token: string, image: Uint8Array) => {
      await changeSession(deps, { token }, (record) => {
        ensureInProgress(record.session)
        if (record.session.captureMode !== 'camera')
          throw new VerificationError('INVALID_CAPTURE_STATE')
      })
      if (!(await deps.settings.get()).allowGalleryUpload)
        throw new VerificationError('INVALID_CAPTURE_STATE')
      try {
        if (!deps.faceEngine?.documentRegions) throw new Error('ENGINE_UNAVAILABLE')
        return await deps.faceEngine.documentRegions(image)
      } catch (error) {
        throw analysisFailure(error)
      }
    },
  }
}
