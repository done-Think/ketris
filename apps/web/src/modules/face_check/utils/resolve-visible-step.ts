import type { SessionStatus } from '../types'
import { finalCaptureStatuses, isCaptureInFlight } from './session-status'

import type { CaptureStep, SelfiePhase } from '../types/capture.types'

export function resolveVisibleStep(step: CaptureStep, status: SessionStatus): CaptureStep {
  if (step === 'alternative' || step === 'submit') return step
  if (isCaptureInFlight(status)) return 'submit'
  if (finalCaptureStatuses.includes(status)) return 'result'

  return step
}

export function resolveSelfiePhase(livenessStep: number, challenges: SelfiePhase[]): SelfiePhase {
  if (livenessStep === 0) return 'position'

  return challenges[livenessStep - 1] ?? 'done'
}
