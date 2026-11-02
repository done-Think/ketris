import { similarityPolicy } from '@server/face_check/config/similarity-policy'
import type {
  OverviewMetrics,
  OverviewScope,
  VerificationSettings,
} from '@server/face_check/types/session.types'

import type { VerificationDependencies } from '../../../types/verification.types'
import { buildOverview } from '../../domain/overview'
import { changeSession, currentSessions } from '../session-access'

export function getSettingsUseCase(deps: VerificationDependencies) {
  return {
    execute: async (): Promise<VerificationSettings> => ({
      ...(await deps.settings.get()),
      faceMatchThreshold: similarityPolicy.approveAbove,
    }),
  }
}

export function updateSettingsUseCase(deps: VerificationDependencies) {
  return {
    execute: async (input: VerificationSettings): Promise<VerificationSettings> => {
      const saved = await deps.settings.save({
        agencyName: input.agencyName.trim(),
        faceMatchThreshold: similarityPolicy.approveAbove,
        maxAttempts: input.maxAttempts,
        allowGalleryUpload: input.allowGalleryUpload,
      })
      for (const record of await currentSessions(deps)) {
        if (!['CREATED', 'IN_PROGRESS'].includes(record.session.status)) continue
        if (record.session.maxAttempts === saved.maxAttempts) continue
        await changeSession(deps, { id: record.session.id }, (current) => {
          if (['CREATED', 'IN_PROGRESS'].includes(current.session.status))
            current.session.maxAttempts = saved.maxAttempts
        })
      }

      return saved
    },
  }
}

export function getOverviewUseCase(deps: VerificationDependencies) {
  return {
    execute: async (scope: OverviewScope): Promise<OverviewMetrics> =>
      buildOverview(
        (await currentSessions(deps)).map((record) => record.session),
        deps.clock(),
        scope,
      ),
  }
}
