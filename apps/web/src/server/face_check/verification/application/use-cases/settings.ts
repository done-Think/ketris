import { similarityPolicy } from '@server/face_check/config/similarity-policy'
import type {
  OverviewMetrics,
  OverviewScope,
  VerificationSettings,
} from '@server/face_check/types/session.types'

import type { VerificationDependencies } from '../../../types/verification.types'
import { buildOverview } from '../../domain/overview'
import { changeSession, currentSessions } from '../session-access'

/** Agencies may only be stricter than the platform floor. */
function effectiveThreshold(value: number | undefined): number {
  return Number.isFinite(value)
    ? Math.min(0.9, Math.max(similarityPolicy.approveAbove, value as number))
    : similarityPolicy.approveAbove
}

export function getSettingsUseCase(deps: VerificationDependencies) {
  return {
    execute: async (): Promise<VerificationSettings> => {
      const settings = await deps.settings.get()
      return { ...settings, faceMatchThreshold: effectiveThreshold(settings.faceMatchThreshold) }
    },
  }
}

export function updateSettingsUseCase(deps: VerificationDependencies) {
  return {
    execute: async (input: VerificationSettings): Promise<VerificationSettings> => {
      const saved = await deps.settings.save({
        agencyName: input.agencyName.trim(),
        faceMatchThreshold: effectiveThreshold(input.faceMatchThreshold),
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
