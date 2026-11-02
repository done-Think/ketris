import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { grabCameraPhoto } from '../utils/camera-photo'
import { maxCapturePhotoBytes } from '../utils/upload-limits'

const native = new Blob(['native-photo'], { type: 'image/jpeg' })
const takePhoto = vi.fn()
const close = vi.fn()
const drawImage = vi.fn()
const track = { readyState: 'live' } as MediaStreamTrack
const stream = { getVideoTracks: () => [track] } as MediaStream
let video: HTMLVideoElement

beforeEach(() => {
  vi.clearAllMocks()
  video = document.createElement('video')
  Object.defineProperties(video, { videoWidth: { value: 1280 }, videoHeight: { value: 720 } })
  vi.stubGlobal(
    'ImageCapture',
    class {
      getPhotoCapabilities = async () => ({ imageWidth: { max: 1920 }, imageHeight: { max: 1080 } })
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

  it('does not get stuck when the device never resolves the native photography request', async () => {
    vi.useFakeTimers()
    takePhoto.mockImplementation(() => new Promise(() => {}))
    const pending = grabCameraPhoto(video, stream)
    await vi.advanceTimersByTimeAsync(2500)
    await expect(pending).resolves.toHaveProperty('type', 'image/jpeg')
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720)
  })
})
