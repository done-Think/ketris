import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCaptureFlowStore } from '../stores/capture-flow-store'
import type { CaptureUploadSlot, DeferredLivenessPlan } from '../types/capture-draft.types'
import type { CaptureFlowState } from '../types/capture.types'

const slots: CaptureUploadSlot[] = ['front', 'back', 'selfie', 'turnLeft', 'turnRight', 'closer']
const plan: DeferredLivenessPlan = {
  planId: '11111111-1111-4111-8111-111111111111',
  expiresAt: '2099-11-01T12:00:00Z',
  challenges: ['turnLeft', 'turnRight', 'closer'],
  step: 0,
}
function images(state: CaptureFlowState) {
  return { ...state.documentImages, selfie: state.selfieImage, ...state.movementImages }
}
function previews(state: CaptureFlowState) {
  return { ...state.previews, selfie: state.selfiePreview, ...state.movementPreviews }
}
function replace(state: CaptureFlowState, slot: CaptureUploadSlot, photo: Blob) {
  if (slot === 'front' || slot === 'back') state.captureDocument(slot, photo)
  else if (slot === 'selfie') state.captureSelfie(photo)
  else state.captureMovement(slot, photo)
}
function filled(uploaded = false) {
  const store = createCaptureFlowStore()
  store.getState().chooseDocument('RG')
  for (const slot of slots) replace(store.getState(), slot, new Blob([slot]))
  store.getState().setLivenessPlan(plan)
  if (uploaded)
    for (const slot of slots) store.getState().rememberUpload(slot, images(store.getState())[slot]!)
  store.getState().goTo('captureReview')
  return store
}
beforeEach(() => {
  let sequence = 0
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => `blob:retake-${++sequence}`),
      revokeObjectURL: vi.fn(),
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe.each([false, true])('retaking a single photo, already uploaded: %s', (uploaded) => {
  it.each(slots)('keeps all six originals when starting and cancelling a %s retake', (slot) => {
    const store = filled(uploaded)
    const originals = images(store.getState())
    const urls = previews(store.getState())
    const receipts = store.getState().uploaded
    store.getState().retakePhoto(slot)
    for (const item of slots) {
      expect(images(store.getState())[item]).toBe(originals[item])
      expect(previews(store.getState())[item]).toBe(urls[item])
    }
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    store.getState().cancelRetake()
    expect(store.getState()).toMatchObject({ step: 'captureReview', retakeTarget: null, plan })
    expect(store.getState().uploaded).toBe(receipts)
    for (const item of slots) expect(images(store.getState())[item]).toBe(originals[item])
  })

  it.each(slots)('replaces only %s and returns directly to the final review', (slot) => {
    const store = filled(uploaded)
    const originals = images(store.getState())
    const urls = previews(store.getState())
    const replacement = new Blob([`replacement-${slot}`])
    store.getState().retakePhoto(slot)
    replace(store.getState(), slot, replacement)
    expect(store.getState()).toMatchObject({ step: 'captureReview', retakeTarget: null })
    for (const item of slots) {
      expect(images(store.getState())[item]).toBe(item === slot ? replacement : originals[item])
      if (item !== slot) expect(previews(store.getState())[item]).toBe(urls[item])
    }
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenLastCalledWith(urls[slot])
    if (uploaded && !['front', 'back', 'selfie'].includes(slot)) {
      expect(store.getState().plan).toBeNull()
      expect(store.getState().uploaded).toEqual({})
    }
  })

  it.each(slots)(
    'retains all originals when allocating a replacement preview for %s fails',
    (slot) => {
      const store = filled(uploaded)
      const originals = images(store.getState())
      const urls = previews(store.getState())
      store.getState().retakePhoto(slot)
      vi.mocked(URL.createObjectURL).mockImplementationOnce(() => {
        throw new Error('NO_PREVIEW_MEMORY')
      })
      expect(() => replace(store.getState(), slot, new Blob(['replacement']))).toThrow(
        'NO_PREVIEW_MEMORY',
      )
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
      for (const item of slots) {
        expect(images(store.getState())[item]).toBe(originals[item])
        expect(previews(store.getState())[item]).toBe(urls[item])
      }
      store.getState().cancelRetake()
      expect(store.getState().step).toBe('captureReview')
    },
  )

  it.each(slots)('does not allow another photo to be changed while retaking %s', (slot) => {
    const store = filled(uploaded)
    const originals = images(store.getState())
    store.getState().retakePhoto(slot)
    const other = slots.find((item) => item !== slot)!
    expect(() => replace(store.getState(), other, new Blob(['unexpected']))).toThrow(
      'INVALID_CAPTURE_STATE',
    )
    for (const item of slots) expect(images(store.getState())[item]).toBe(originals[item])
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })
})
