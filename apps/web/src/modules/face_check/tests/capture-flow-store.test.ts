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
  it('retakes a rejected back without discarding any selfie, movement or accepted front upload', () => {
    const store = createCaptureFlowStore()
    const front = new Blob(['front'])
    const selfie = new Blob(['selfie'])
    store.getState().chooseDocument('RG')
    store.getState().captureDocument('front', front)
    store.getState().captureDocument('back', new Blob(['bad-back']))
    store.getState().captureSelfie(selfie)
    for (const pose of ['turnLeft', 'turnRight', 'closer'] as const)
      store.getState().captureMovement(pose, new Blob([pose]))
    const plan = {
      planId: '11111111-1111-4111-8111-111111111111',
      expiresAt: '2099-11-01T12:00:00Z',
      challenges: ['turnLeft', 'turnRight', 'closer'] as ('turnLeft' | 'turnRight' | 'closer')[],
      step: 0,
    }
    store.getState().setLivenessPlan(plan)
    store.getState().rememberUpload('front', front)
    store.getState().goTo('captureReview')
    const previews = { ...store.getState().movementPreviews }
    store.getState().retakePhoto('back')
    expect(store.getState()).toMatchObject({
      selfieImage: selfie,
      movementPreviews: previews,
      plan,
      uploaded: { front },
    })
    const replacement = new Blob(['readable-back'])
    store.getState().captureDocument('back', replacement)
    expect(store.getState()).toMatchObject({
      step: 'captureReview',
      selfieImage: selfie,
      documentImages: { front, back: replacement },
      uploaded: { front },
      plan,
    })
  })

  it('keeps local photos but requires fresh server validation when a document changes after selfie upload', () => {
    const store = createCaptureFlowStore()
    store.getState().chooseDocument('RG')
    store.getState().captureDocument('front', new Blob(['front']))
    store.getState().captureDocument('back', new Blob(['back']))
    const selfie = new Blob(['selfie'])
    store.getState().captureSelfie(selfie)
    for (const pose of ['turnLeft', 'turnRight', 'closer'] as const)
      store.getState().captureMovement(pose, new Blob([pose]))
    store.getState().rememberUpload('selfie', selfie)
    store.getState().goTo('captureReview')
    store.getState().retakePhoto('back')
    expect(store.getState()).toMatchObject({ selfieImage: selfie })
    store.getState().captureDocument('back', new Blob(['new-back']))
    expect(store.getState().step).toBe('captureReview')
    expect(store.getState()).toMatchObject({ plan: null, uploaded: {} })
  })

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
    store.getState().retakePhoto('front')
    expect(store.getState()).toMatchObject({
      step: 'document',
      side: 'front',
      capturedSides: ['front', 'back'],
      documentImages: { front, back },
      previews: { front: 'blob:5', back: 'blob:4' },
    })
    expect(revoke).not.toHaveBeenCalledWith('blob:5')
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
