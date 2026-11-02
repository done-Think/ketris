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

export function createCaptureFlowStore(): CaptureFlowStore {
  return createStore<CaptureFlowState>()((set) => ({
    step: 'consent',
    documentType: null,
    documentImages: { front: null, back: null },
    setDocumentImage: (side, image) =>
      set((state) => ({ documentImages: { ...state.documentImages, [side]: image } })),
    clearImages: () => set({ documentImages: { front: null, back: null } }),
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
          documentType,
          documentImages: { front: null, back: null },
          capturedSides: [],
          previews: {},
          side: 'front',
        }
      }),
    markCaptured: (side, preview) =>
      set((state) => {
        const previousSides =
          side === 'front'
            ? state.capturedSides.filter((item) => item !== 'back')
            : state.capturedSides
        const previousPreviews =
          side === 'front' ? withoutPreview(state.previews, 'back') : state.previews
        const capturedSides = previousSides.includes(side)
          ? previousSides
          : [...previousSides, side]
        const previews = preview
          ? { ...withoutPreview(previousPreviews, side), [side]: preview }
          : previousPreviews
        const documentImages =
          side === 'front' ? { ...state.documentImages, back: null } : state.documentImages
        const missing = sidesInOrder.find((item) => !capturedSides.includes(item))

        return missing
          ? {
              capturedSides,
              previews,
              documentImages,
              side: missing,
              step: 'document',
              livenessStep: 0,
            }
          : { capturedSides, previews, documentImages, step: 'documentReview', livenessStep: 0 }
      }),
    retakeSide: (side) =>
      set((state) => {
        if (side === 'front') {
          Object.values(state.previews).forEach(releasePreview)
          return {
            side,
            documentImages: { front: null, back: null },
            step: 'document',
            capturedSides: [],
            previews: {},
            livenessStep: 0,
          }
        }
        return {
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
    resetLiveness: () => set({ livenessStep: 0 }),
    syncLivenessStep: (livenessStep) => set({ livenessStep }),
    retryChallenges: () => set({ livenessStep: 1 }),
    restartAttempt: () =>
      set((state) => {
        Object.values(state.previews).forEach(releasePreview)

        return {
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
