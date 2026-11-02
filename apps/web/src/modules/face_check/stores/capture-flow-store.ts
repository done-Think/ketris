import { createStore } from 'zustand/vanilla'

import type { DocumentSide } from '../types'

import type { CaptureFlowState, CaptureFlowStore } from '../types/capture.types'

const sidesInOrder = ['front', 'back'] as const

function releasePreview(url?: string) {
  if (url) URL.revokeObjectURL(url)
}

function withoutPreview(previews: CaptureFlowState['previews'], side: DocumentSide) {
  releasePreview(previews[side])
  const next = { ...previews }
  delete next[side]

  return next
}

function clearSelfieDrafts(state: CaptureFlowState) {
  if (state.selfiePreview) releasePreview(state.selfiePreview)
  Object.values(state.movementPreviews).forEach(releasePreview)
  return {
    selfieImage: null,
    selfiePreview: null,
    movementImages: {},
    movementPreviews: {},
    plan: null,
    uploaded: {},
    livenessStep: 0,
  }
}

export function createCaptureFlowStore(): CaptureFlowStore {
  return createStore<CaptureFlowState>()((set) => ({
    step: 'consent',
    documentType: null,
    selfieImage: null,
    selfiePreview: null,
    movementImages: {},
    movementPreviews: {},
    plan: null,
    uploaded: {},
    captureSelfie: (image) =>
      set((state) => ({
        ...clearSelfieDrafts(state),
        selfieImage: image,
        selfiePreview: URL.createObjectURL(image),
      })),
    captureMovement: (challenge, image) =>
      set((state) => {
        releasePreview(state.movementPreviews[challenge])
        return {
          movementImages: { ...state.movementImages, [challenge]: image },
          movementPreviews: { ...state.movementPreviews, [challenge]: URL.createObjectURL(image) },
        }
      }),
    setLivenessPlan: (plan) =>
      set((state) => ({
        plan,
        ...(state.plan?.planId !== plan.planId ? { uploaded: {} } : {}),
      })),
    rememberUpload: (slot, image) =>
      set((state) => ({ uploaded: { ...state.uploaded, [slot]: image } })),
    retakeMovements: () => set({ step: 'selfie', livenessStep: 1 }),
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
        const capturedSides = state.capturedSides.includes(side)
          ? state.capturedSides
          : [...state.capturedSides, side]
        const previews = {
          ...withoutPreview(state.previews, side),
          [side]: URL.createObjectURL(image),
        }
        const documentImages = { ...state.documentImages, [side]: image }
        const missing = sidesInOrder.find((item) => !capturedSides.includes(item))

        const reset = clearSelfieDrafts(state)
        return missing
          ? {
              ...reset,
              capturedSides,
              previews,
              documentImages,
              side: missing,
              step: 'document',
              livenessStep: 0,
            }
          : {
              ...reset,
              capturedSides,
              previews,
              documentImages,
              step: 'documentReview',
              livenessStep: 0,
            }
      }),
    retakeSide: (side) =>
      set((state) => {
        return {
          ...clearSelfieDrafts(state),
          side,
          documentImages: { ...state.documentImages, [side]: null },
          step: 'document',
          capturedSides: state.capturedSides.filter((item) => item !== side),
          previews: withoutPreview(state.previews, side),
          livenessStep: 0,
        }
      }),
    advanceLiveness: (totalChallenges) =>
      set((state) => ({ livenessStep: Math.min(totalChallenges + 1, state.livenessStep + 1) })),
    resetLiveness: () => set((state) => clearSelfieDrafts(state)),
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
