import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCaptureFlowStore } from '../stores/capture-flow-store'

describe('document recapture order', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('requires a new back after retaking the front and revokes both previous previews', () => {
    const revoke = vi.fn()
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { revokeObjectURL: revoke }))
    const store = createCaptureFlowStore()
    store.getState().chooseDocument('RG')
    store.getState().markCaptured('front', 'blob:first-front')
    store.getState().markCaptured('back', 'blob:first-back')
    expect(store.getState().step).toBe('documentReview')
    store.getState().retakeSide('front')
    expect(store.getState()).toMatchObject({
      step: 'document',
      side: 'front',
      capturedSides: [],
      previews: {},
    })
    expect(revoke).toHaveBeenCalledWith('blob:first-front')
    expect(revoke).toHaveBeenCalledWith('blob:first-back')
    store.getState().markCaptured('front', 'blob:new-front')
    expect(store.getState()).toMatchObject({
      step: 'document',
      side: 'back',
      capturedSides: ['front'],
      previews: { front: 'blob:new-front' },
    })
    store.getState().markCaptured('back', 'blob:new-back')
    expect(store.getState().step).toBe('documentReview')
  })

  it('also invalidates the back if an imported front replaces it directly', () => {
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { revokeObjectURL: vi.fn() }))
    const store = createCaptureFlowStore()
    store.getState().markCaptured('front', 'blob:first-front')
    store.getState().markCaptured('back', 'blob:first-back')
    store.getState().markCaptured('front', 'blob:imported-front')
    expect(store.getState()).toMatchObject({
      step: 'document',
      side: 'back',
      capturedSides: ['front'],
    })
    expect(store.getState().previews.back).toBeUndefined()
  })
})
