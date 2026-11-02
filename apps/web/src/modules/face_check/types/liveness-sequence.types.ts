import type { LivenessChallenge } from './session.types'
import type { LivenessProgressView } from './capture.types'

export interface LivenessSequenceOptions {
  token: string
  enabled: boolean
  capture: (challenge: LivenessChallenge, signal: AbortSignal) => Promise<LivenessProgressView>
  onProgress: (step: number) => void
  prepareSound: () => void
  tickSound: () => void
}
