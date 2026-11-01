import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { drawToJpeg, grabPreviewFrame, grabVideoFrame } from '../utils/image-capture'
import { maxCapturePhotoBytes } from '../utils/upload-limits'

const drawImage = vi.fn()
const context = { drawImage, imageSmoothingEnabled: false, imageSmoothingQuality: 'low' }
let frames: { width: number; height: number; quality: number | undefined }[]

beforeEach(() => {
  frames = []
  drawImage.mockClear()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback,
    _type,
    quality,
  ) {
    frames.push({ width: this.width, height: this.height, quality })
    callback(new Blob(['photo'], { type: 'image/jpeg' }))
  })
})
afterEach(() => vi.restoreAllMocks())

describe('camera photo detail and upload budget', () => {
  it('uses small uncropped feedback probes while preserving full-size evidence capture', async () => {
    const video = document.createElement('video')
    Object.defineProperties(video, { videoWidth: { value: 1920 }, videoHeight: { value: 1080 } })
    await grabPreviewFrame(video)
    await grabVideoFrame(video)
    expect(frames.map(({ width, height }) => [width, height])).toEqual([
      [640, 360],
      [1920, 1080],
    ])
  })
  it.each([
    [1920, 1080],
    [3840, 2160],
    [2160, 3840],
    [640, 480],
  ])(
    'preserves the native %s × %s frame without upscaling or reducing Full HD',
    async (width, height) => {
      const video = document.createElement('video')
      Object.defineProperties(video, {
        videoWidth: { value: width },
        videoHeight: { value: height },
      })
      const image = await grabVideoFrame(video)
      expect(image.type).toBe('image/jpeg')
      expect(frames).toEqual([{ width, height, quality: 0.95 }])
      expect(drawImage).toHaveBeenCalledWith(video, 0, 0, width, height)
    },
  )

  it('bounds very large imports while preserving proportions and high-quality resampling', async () => {
    await drawToJpeg(document.createElement('canvas'), 7680, 4320)
    expect(frames).toEqual([{ width: 3840, height: 2160, quality: 0.95 }])
    expect(context).toMatchObject({ imageSmoothingEnabled: true, imageSmoothingQuality: 'high' })
  })

  it('keeps the full frame when a small JPEG adjustment is enough to fit the upload limit', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      _type,
      quality,
    ) {
      frames.push({ width: this.width, height: this.height, quality })
      callback(new Blob([new Uint8Array(quality === 0.95 ? maxCapturePhotoBytes + 1 : 100)]))
    })
    const image = await drawToJpeg(document.createElement('canvas'), 3840, 2160)
    expect(image.size).toBeLessThanOrEqual(maxCapturePhotoBytes)
    expect(frames.map((frame) => frame.quality)).toEqual([0.95, 0.9])
    expect(frames.every((frame) => frame.width === 3840 && frame.height === 2160)).toBe(true)
  })

  it('reduces oversized frames proportionally before applying harsh JPEG compression', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      _type,
      quality,
    ) {
      frames.push({ width: this.width, height: this.height, quality })
      callback(new Blob([new Uint8Array(this.width === 3840 ? maxCapturePhotoBytes * 2 : 100)]))
    })
    const source = document.createElement('video')
    const image = await drawToJpeg(source, 3840, 2160)
    expect(image.size).toBeLessThanOrEqual(maxCapturePhotoBytes)
    const last = frames.at(-1)!
    expect(last.width).toBeLessThan(3840)
    expect(last.width).toBeGreaterThanOrEqual(1280)
    expect(last.width / last.height).toBeCloseTo(16 / 9, 2)
    expect(last.quality).toBe(0.95)
    expect(frames.every((frame) => frame.quality! >= 0.85)).toBe(true)
    expect(drawImage.mock.calls[0][0]).toBe(source)
    expect(drawImage.mock.calls[1][0]).toBeInstanceOf(HTMLCanvasElement)
    expect(drawImage.mock.calls.filter(([input]) => input === source)).toHaveLength(1)
  })

  it('keeps the size limit when an image cannot be encoded within the allowed budget', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob([new Uint8Array(maxCapturePhotoBytes + 1)]))
    })
    await expect(drawToJpeg(document.createElement('canvas'), 1280, 720)).rejects.toThrow(
      'CAPTURE_TOO_LARGE',
    )
  })

  it('refuses a missing camera frame or failed JPEG encoder', async () => {
    await expect(grabVideoFrame(null)).rejects.toThrow('CAMERA_NOT_READY')
    await expect(grabVideoFrame(document.createElement('video'))).rejects.toThrow(
      'CAMERA_NOT_READY',
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null))
    await expect(drawToJpeg(document.createElement('canvas'), 1920, 1080)).rejects.toThrow(
      'CAPTURE_FAILED',
    )
  })
})
