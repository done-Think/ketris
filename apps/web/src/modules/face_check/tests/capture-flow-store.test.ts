import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCaptureFlowStore } from '../stores/capture-flow-store'

const revoke = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: (image: Blob) => `blob:${image.size}`,
      revokeObjectURL: revoke,
    }),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('local document drafts', () => {
  it('retakes only the selected side and keeps the other photo for review', () => {
    const store = createCaptureFlowStore()
    const front = new Blob(['front'])
    const back = new Blob(['back'])
    store.getState().chooseDocument('RG')
    store.getState().captureDocument('front', front)
    expect(store.getState()).toMatchObject({
      step: 'document',
      side: 'back',
      documentImages: { front, back: null },
    })
    store.getState().captureDocument('back', back)
    expect(store.getState().step).toBe('documentReview')
    store.getState().retakeSide('front')
    expect(store.getState()).toMatchObject({
      step: 'document',
      side: 'front',
      capturedSides: ['back'],
      documentImages: { front: null, back },
      previews: { back: 'blob:4' },
    })
    expect(revoke).toHaveBeenCalledWith('blob:5')
    expect(revoke).not.toHaveBeenCalledWith('blob:4')
    store.getState().captureDocument('front', new Blob(['new-front']))
    expect(store.getState()).toMatchObject({ step: 'documentReview', documentImages: { back } })
  })

  it('drops both drafts and releases previews when changing document type', () => {
    const store = createCaptureFlowStore()
    store.getState().chooseDocument('RG')
    store.getState().captureDocument('front', new Blob(['front']))
    store.getState().captureDocument('back', new Blob(['back']))
    store.getState().chooseDocument('CNH')
    expect(store.getState()).toMatchObject({
      side: 'front',
      documentImages: { front: null, back: null },
      previews: {},
      capturedSides: [],
    })
    expect(revoke).toHaveBeenCalledTimes(2)
  })

  it('releases photos and object URLs when the capture is left or restarted', () => {
    const store = createCaptureFlowStore()
    store.getState().captureDocument('front', new Blob(['front']))
    store.getState().captureDocument('back', new Blob(['back']))
    store.getState().clearImages()
    expect(store.getState()).toMatchObject({
      documentImages: { front: null, back: null },
      previews: {},
      capturedSides: [],
    })
    expect(revoke).toHaveBeenCalledTimes(2)
  })
})
