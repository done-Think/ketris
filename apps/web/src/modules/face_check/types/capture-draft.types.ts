import type { LivenessChallenge } from './session.types'
import type { LivenessSequenceState } from './api.types'

export interface DeferredLivenessPlan extends LivenessSequenceState {
  planId: string
  expiresAt: string
}

export type CaptureUploadSlot = 'front' | 'back' | 'selfie' | Exclude<LivenessChallenge, 'blink'>
export type CaptureRetakeReturnStep = 'documentReview' | 'captureReview' | 'selfie'

export interface CaptureDraftState {
  retakeTarget: CaptureUploadSlot | null
  retakeReturnStep: CaptureRetakeReturnStep | null
  selfieImage: Blob | null
  selfiePreview: string | null
  movementImages: Partial<Record<LivenessChallenge, Blob>>
  movementPreviews: Partial<Record<LivenessChallenge, string>>
  plan: DeferredLivenessPlan | null
  uploaded: Partial<Record<CaptureUploadSlot, Blob>>
  captureSelfie(image: Blob): void
  captureMovement(challenge: LivenessChallenge, image: Blob): void
  setLivenessPlan(plan: DeferredLivenessPlan): void
  rememberUpload(slot: CaptureUploadSlot, image: Blob): void
  retakePhoto(slot: CaptureUploadSlot): void
  cancelRetake(): void
}
