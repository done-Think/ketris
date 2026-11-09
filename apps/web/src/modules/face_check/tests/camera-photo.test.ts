import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { grabCameraPhoto } from '../utils/camera-photo'
import { maxCapturePhotoBytes } from '../utils/upload-limits'

const native = new Blob(['native-photo'], { type: 'image/jpeg' })
const takePhoto = vi.fn()
const getPhotoCapabilities = vi.fn()
const close = vi.fn()
const drawImage = vi.fn()
const track = { readyState: 'live' } as MediaStreamTrack
const stream = { getVideoTracks: () => [track] } as MediaStream
let video: HTMLVideoElement

beforeEach(() => {
  vi.clearAllMocks()
  getPhotoCapabilities.mockResolvedValue({ imageWidth: { max: 1920 }, imageHeight: { max: 1080 } })
  video = document.createElement('video')
  Object.defineProperties(video, { videoWidth: { value: 1280 }, videoHeight: { value: 720 } })
  vi.stubGlobal(
    'ImageCapture',
    class {
      getPhotoCapabilities = getPhotoCapabilities
      takePhoto = takePhoto
    },
  )
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width: 1920, height: 1080, close }),
  )
  takePhoto.mockResolvedValue(native)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) =>
    callback(new Blob(['video-frame'], { type: 'image/jpeg' })),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('native still photo capture', () => {
  it('keeps the native Full HD photo instead of taking a lower-resolution video frame', async () => {
    const image = await grabCameraPhoto(video, stream)
    expect(takePhoto).toHaveBeenCalledWith({ imageWidth: 1920, imageHeight: 1080 })
    expect(image).toBe(native)
    expect(drawImage).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledOnce()
  })

  it('converts oversized native photos within the existing upload budget and closes the bitmap', async () => {
    takePhoto.mockResolvedValue(
      new Blob([new Uint8Array(maxCapturePhotoBytes + 1)], { type: 'image/jpeg' }),
    )
    const image = await grabCameraPhoto(video, stream)
    expect(image.size).toBeLessThanOrEqual(maxCapturePhotoBytes)
    expect(drawImage).toHaveBeenCalled()
    expect(close).toHaveBeenCalledOnce()
  })

  it('uses the full video frame instead of accepting a lower-resolution native photo', async () => {
    vi.mocked(createImageBitmap).mockResolvedValue({
      width: 640,
      height: 480,
      close,
    } as ImageBitmap)
    const image = await grabCameraPhoto(video, stream)
    expect(image).not.toBe(native)
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
    expect(close).toHaveBeenCalledOnce()
  })

  it('still uses native photography when photo capability enumeration is unavailable', async () => {
    getPhotoCapabilities.mockRejectedValue(new DOMException('No capabilities', 'NotSupportedError'))
    expect(await grabCameraPhoto(video, stream)).toBe(native)
    expect(takePhoto).toHaveBeenCalledWith()
    expect(drawImage).not.toHaveBeenCalled()
  })

  it('retries native photography without an unsupported size before falling back to video', async () => {
    takePhoto.mockRejectedValueOnce(new DOMException('Unsupported size', 'OverconstrainedError'))
    expect(await grabCameraPhoto(video, stream)).toBe(native)
    expect(takePhoto).toHaveBeenCalledTimes(2)
    expect(takePhoto).toHaveBeenLastCalledWith()
    expect(drawImage).not.toHaveBeenCalled()
  })

  it('falls back to the full video frame when still photography is unsupported', async () => {
    takePhoto.mockRejectedValue(new DOMException('Unsupported', 'NotSupportedError'))
    expect(await grabCameraPhoto(video, stream)).toHaveProperty('type', 'image/jpeg')
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
  })

  it('works on browsers without the optional ImageCapture API', async () => {
    vi.stubGlobal('ImageCapture', undefined)
    await grabCameraPhoto(video, stream)
    expect(takePhoto).not.toHaveBeenCalled()
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
  })

  it('crops the native photo without adding preview borders or surrounding pixels', async () => {
    const crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
    expect(await grabCameraPhoto(video, stream, crop)).not.toBe(native)
    expect(drawImage).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1920 }),
      480,
      270,
      960,
      540,
      0,
      0,
      960,
      540,
    )
    expect(close).toHaveBeenCalledOnce()
  })

  it('uses the preview geometry if the native photo has a different sensor aspect ratio', async () => {
    vi.mocked(createImageBitmap).mockResolvedValue({
      width: 2048,
      height: 1536,
      close,
    } as ImageBitmap)
    await grabCameraPhoto(video, stream, { x: 0.25, y: 0.25, width: 0.5, height: 0.5 })
    expect(drawImage).toHaveBeenCalledWith(video, 320, 180, 640, 360, 0, 0, 640, 360)
  })

  it('does not get stuck when the device never resolves the native photography request', async () => {
    vi.useFakeTimers()
    takePhoto.mockImplementation(() => new Promise(() => {}))
    const pending = grabCameraPhoto(video, stream)
    await vi.advanceTimersByTimeAsync(2500)
    await expect(pending).resolves.toHaveProperty('type', 'image/jpeg')
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
  })
})
