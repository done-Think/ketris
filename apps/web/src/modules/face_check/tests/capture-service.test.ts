import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import { maxCapturePhotoBytes } from '../utils/upload-limits'

describe('public face_check uploads', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('sends one photo as multipart with the API contract and without dashboard cookies', async () => {
    const image = new Blob(['photo'], { type: 'image/jpeg' })
    await captureService.uploadDocumentImage('token', { side: 'front', documentType: 'RG', image })
    const [path, request] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/face_check/capture/token/document')
    expect(request.credentials).toBe('omit')
    expect(request.headers['X-Ketris-Api-Version']).toBe('3')
    expect(request.headers['Content-Type']).toBeUndefined()
    expect(request.body).toBeInstanceOf(FormData)
    expect(request.body.getAll('image')).toHaveLength(1)
    expect(request.body.get('side')).toBe('front')
  })

  it('rejects an oversized image before any network request', () => {
    const image = new Blob([new Uint8Array(maxCapturePhotoBytes + 1)], { type: 'image/jpeg' })
    expect(() =>
      captureService.uploadDocumentImage('token', { side: 'front', documentType: 'CNH', image }),
    ).toThrowError(expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE' }))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a cancellable small framing probe without dashboard credentials', async () => {
    const controller = new AbortController()
    await captureService.framing(
      'token',
      new Blob(['preview'], { type: 'image/jpeg' }),
      controller.signal,
    )
    const [path, request] = fetchMock.mock.calls[0]
    expect(path).toBe('/api/face_check/capture/token/framing')
    expect(request.credentials).toBe('omit')
    expect(request.cache).toBe('no-store')
    expect([...request.body.keys()]).toEqual(['image'])
    expect(() =>
      captureService.framing(
        'token',
        new Blob([new Uint8Array(512 * 1024 + 1)]),
        controller.signal,
      ),
    ).toThrowError(expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE' }))
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('returns an expired token error without attempting a session refresh', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'SESSION_EXPIRED', message: 'Expired' } }),
    })
    await expect(captureService.getSession('expired')).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
      status: 401,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).not.toContain('/auth/')
  })

  it('aborts an in-flight request when its query or capture flow is cancelled', async () => {
    fetchMock.mockImplementation(
      (_path, request) =>
        new Promise((_resolve, reject) => {
          request.signal.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          )
        }),
    )
    const controller = new AbortController()
    const request = captureService.getSession('token', controller.signal)
    controller.abort()
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('keeps a rejected photo reason and details from the Ketris error envelope', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: {
          code: 'PHOTO_REJECTED',
          message: 'Photo is blurry',
          details: { reason: 'blurry', sharpness: 0.1 },
        },
      }),
    })
    const error = await captureService
      .uploadSelfie('token', new Blob(['photo']))
      .catch((failure) => failure)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'PHOTO_REJECTED',
      reason: 'blurry',
      message: 'Photo is blurry',
      details: { sharpness: 0.1 },
    })
  })
})
