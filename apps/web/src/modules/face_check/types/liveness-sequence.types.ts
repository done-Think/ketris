import type { LivenessChallenge } from './session.types'
import type { DeferredLivenessPlan } from './capture-draft.types'

export interface LivenessSequenceOptions {
  token: string
  enabled: boolean
  planId: string | null
  localStep: number
  onPlan(plan: DeferredLivenessPlan): void
  capture: (challenge: LivenessChallenge, signal: AbortSignal) => Promise<void>
  onProgress: (step: number) => void
  prepareSound: () => void
  tickSound: () => void
}
