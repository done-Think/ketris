import { createStore } from 'zustand/vanilla'

import type { DocumentSide, LivenessChallenge } from '../types'

import type { CaptureFlowState, CaptureFlowStore } from '../types/capture.types'
import { hasCompleteSelfieDrafts } from '../utils/capture-drafts'
import type { CaptureUploadSlot } from '../types/capture-draft.types'

const sidesInOrder = ['front', 'back'] as const

function releasePreview(url?: string) {
  if (url) URL.revokeObjectURL(url)
}

function clearSelfieDrafts(state: CaptureFlowState) {
  if (state.selfiePreview) releasePreview(state.selfiePreview)
  Object.values(state.movementPreviews).forEach(releasePreview)
  return {
    retakeTarget: null,
    retakeReturnStep: null,
    selfieImage: null,
    selfiePreview: null,
    movementImages: {},
    movementPreviews: {},
    plan: null,
    uploaded: {},
    livenessStep: 0,
  }
}

function finishRetake(
  state: CaptureFlowState,
  slot: CaptureUploadSlot | LivenessChallenge,
): Partial<CaptureFlowState> {
  if (state.retakeTarget !== slot) return {}
  const step = state.retakeReturnStep ?? 'captureReview'
  return {
    step,
    retakeTarget: null,
    retakeReturnStep: null,
    ...(step === 'captureReview' ? { livenessStep: (state.plan?.challenges.length ?? 3) + 1 } : {}),
  }
}

function invalidateFaceUpload(
  state: CaptureFlowState,
  slot: CaptureUploadSlot | LivenessChallenge,
) {
  if (
    slot !== 'selfie' &&
    (state.uploaded.selfie || (state.uploaded.front && state.uploaded.back))
  ) {
    // A server checkpoint may already include this pose, even if its acknowledgement
    // was lost. Revalidate the retained local set under a new plan on final confirmation.
    return { plan: null, uploaded: {} }
  }
  const uploaded = { ...state.uploaded }
  if (slot !== 'blink') delete uploaded[slot]
  if (slot === 'selfie') {
    for (const pose of ['turnLeft', 'turnRight', 'closer'] as const) delete uploaded[pose]
  }
  return { uploaded }
}

function invalidateDocumentUpload(state: CaptureFlowState, side: DocumentSide) {
  // The backend locks documents after accepting the selfie. A new plan will revalidate
  // the existing local images on final confirmation, without asking for new selfies.
  if (state.uploaded.selfie || (state.uploaded.front && state.uploaded.back))
    return { plan: null, uploaded: {} }
  const uploaded = { ...state.uploaded }
  delete uploaded[side]
  if (side === 'front') delete uploaded.back
  return { uploaded }
}

export function createCaptureFlowStore(): CaptureFlowStore {
  return createStore<CaptureFlowState>()((set) => ({
    step: 'consent',
    documentType: null,
    retakeTarget: null,
    retakeReturnStep: null,
    selfieImage: null,
    selfiePreview: null,
    movementImages: {},
    movementPreviews: {},
    plan: null,
    uploaded: {},
    captureSelfie: (image) =>
      set((state) => {
        if (state.retakeTarget && state.retakeTarget !== 'selfie')
          throw new Error('INVALID_CAPTURE_STATE')
        const preview = URL.createObjectURL(image)
        releasePreview(state.selfiePreview ?? undefined)
        return {
          ...invalidateFaceUpload(state, 'selfie'),
          selfieImage: image,
          selfiePreview: preview,
          livenessStep: 0,
          ...finishRetake(state, 'selfie'),
        }
      }),
    captureMovement: (challenge, image) =>
      set((state) => {
        if (state.retakeTarget && state.retakeTarget !== challenge)
          throw new Error('INVALID_CAPTURE_STATE')
        const preview = URL.createObjectURL(image)
        releasePreview(state.movementPreviews[challenge])
        return {
          ...invalidateFaceUpload(state, challenge),
          movementImages: { ...state.movementImages, [challenge]: image },
          movementPreviews: { ...state.movementPreviews, [challenge]: preview },
          ...finishRetake(state, challenge),
        }
      }),
    setLivenessPlan: (plan) =>
      set((state) => ({
        plan,
        ...(state.plan?.planId !== plan.planId ? { uploaded: {} } : {}),
      })),
    rememberUpload: (slot, image) =>
      set((state) => ({ uploaded: { ...state.uploaded, [slot]: image } })),
    retakePhoto: (slot) =>
      set((state) => ({
        retakeTarget: slot,
        retakeReturnStep:
          state.retakeReturnStep ??
          (state.step === 'captureReview'
            ? 'captureReview'
            : slot === 'front' || slot === 'back'
              ? 'documentReview'
              : 'selfie'),
        ...(slot === 'front' || slot === 'back'
          ? { side: slot, step: 'document' }
          : {
              step: 'selfie',
              livenessStep:
                slot === 'selfie'
                  ? 0
                  : Math.max(
                      0,
                      (state.plan?.challenges ?? ['turnLeft', 'turnRight', 'closer']).indexOf(slot),
                    ) + 1,
            }),
      })),
    cancelRetake: () =>
      set((state) => (state.retakeTarget ? finishRetake(state, state.retakeTarget) : {})),
    documentImages: { front: null, back: null },
    clearImages: () =>
      set((state) => {
        Object.values(state.previews).forEach(releasePreview)
        return {
          ...clearSelfieDrafts(state),
          documentImages: { front: null, back: null },
          previews: {},
          capturedSides: [],
        }
      }),
    side: 'front',
    capturedSides: [],
    previews: {},
    livenessStep: 0,
    goTo: (step) => set({ step }),
    chooseDocument: (documentType) =>
      set((state) => {
        if (state.documentType === documentType) return {}
        if (state.retakeTarget) throw new Error('INVALID_CAPTURE_STATE')
        Object.values(state.previews).forEach(releasePreview)
        return {
          ...clearSelfieDrafts(state),
          documentType,
          documentImages: { front: null, back: null },
          capturedSides: [],
          previews: {},
          side: 'front',
        }
      }),
    captureDocument: (side, image) =>
      set((state) => {
        if (state.retakeTarget && state.retakeTarget !== side)
          throw new Error('INVALID_CAPTURE_STATE')
        const preview = URL.createObjectURL(image)
        const capturedSides = state.capturedSides.includes(side)
          ? state.capturedSides
          : [...state.capturedSides, side]
        const previews = {
          ...state.previews,
          [side]: preview,
        }
        const documentImages = { ...state.documentImages, [side]: image }
        const missing = sidesInOrder.find((item) => !capturedSides.includes(item))

        const invalidated = invalidateDocumentUpload(state, side)
        releasePreview(state.previews[side])
        return missing
          ? {
              ...invalidated,
              capturedSides,
              previews,
              documentImages,
              side: missing,
              step: 'document',
              ...finishRetake(state, side),
            }
          : {
              ...invalidated,
              capturedSides,
              previews,
              documentImages,
              step: hasCompleteSelfieDrafts(state) ? 'captureReview' : 'documentReview',
              ...finishRetake(state, side),
            }
      }),
    advanceLiveness: (totalChallenges) =>
      set((state) => ({ livenessStep: Math.min(totalChallenges + 1, state.livenessStep + 1) })),
    syncLivenessStep: (livenessStep) => set({ livenessStep }),
    retryChallenges: () => set({ livenessStep: 1 }),
    restartAttempt: () =>
      set((state) => {
        Object.values(state.previews).forEach(releasePreview)

        return {
          ...clearSelfieDrafts(state),
          step: 'document',
          side: 'front',
          capturedSides: [],
          previews: {},
          livenessStep: 0,
          documentImages: { front: null, back: null },
        }
      }),
  }))
}
