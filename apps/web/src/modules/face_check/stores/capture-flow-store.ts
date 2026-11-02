import { createStore } from 'zustand/vanilla'

import type { DocumentSide } from '../types'

import type { CaptureFlowState, CaptureFlowStore } from '../types/capture.types'
import { hasCompleteSelfieDrafts } from '../utils/capture-drafts'

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
    retakeMovements: (challenge = 'turnLeft') =>
      set((state) => ({
        step: 'selfie',
        livenessStep:
          Math.max(
            0,
            (state.plan?.challenges ?? ['turnLeft', 'turnRight', 'closer']).indexOf(challenge),
          ) + 1,
      })),
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

        const invalidated = invalidateDocumentUpload(state, side)
        return missing
          ? {
              ...invalidated,
              capturedSides,
              previews,
              documentImages,
              side: missing,
              step: 'document',
            }
          : {
              ...invalidated,
              capturedSides,
              previews,
              documentImages,
              step: hasCompleteSelfieDrafts(state) ? 'captureReview' : 'documentReview',
            }
      }),
    retakeSide: (side) =>
      set((state) => {
        return {
          ...invalidateDocumentUpload(state, side),
          side,
          documentImages: { ...state.documentImages, [side]: null },
          step: 'document',
          capturedSides: state.capturedSides.filter((item) => item !== side),
          previews: withoutPreview(state.previews, side),
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
