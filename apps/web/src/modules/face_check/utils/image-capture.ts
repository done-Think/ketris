import { maxCapturePhotoBytes, maxCapturePhotoSide } from './upload-limits'
import type { NormalizedImageCrop } from '../types/image-crop.types'

const minimumResizeSide = 1280
const jpegQualities = [0.95, 0.9, 0.85]

function scaledSize(width: number, height: number) {
  const scale = Math.min(1, maxCapturePhotoSide / Math.max(width, height))

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('CAPTURE_FAILED'))),
      'image/jpeg',
      quality,
    ),
  )
}

export async function drawToJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  crop?: NormalizedImageCrop,
): Promise<Blob> {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error('CAPTURE_FAILED')
  if (
    crop &&
    (!Object.values(crop).every(Number.isFinite) ||
      crop.x < 0 ||
      crop.y < 0 ||
      crop.width <= 0 ||
      crop.height <= 0 ||
      crop.x + crop.width > 1 ||
      crop.y + crop.height > 1)
  )
    throw new Error('CAPTURE_FAILED')
  let rectangle = crop
    ? {
        x: Math.round(crop.x * width),
        y: Math.round(crop.y * height),
        width: Math.round((crop.x + crop.width) * width) - Math.round(crop.x * width),
        height: Math.round((crop.y + crop.height) * height) - Math.round(crop.y * height),
      }
    : null
  if (rectangle && (!rectangle.width || !rectangle.height)) throw new Error('CAPTURE_FAILED')
  let size = scaledSize(rectangle?.width ?? width, rectangle?.height ?? height)
  let frame = source

  for (;;) {
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('CANVAS_UNAVAILABLE')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    if (rectangle) {
      context.drawImage(
        frame,
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height,
        0,
        0,
        size.width,
        size.height,
      )
    } else context.drawImage(frame, 0, 0, size.width, size.height)
    let encodedBytes = 0
    for (const quality of jpegQualities) {
      const blob = await encodeJpeg(canvas, quality)
      if (blob.size <= maxCapturePhotoBytes) return blob
      encodedBytes = blob.size
    }
    const longestSide = Math.max(size.width, size.height)
    if (longestSide <= minimumResizeSide) throw new Error('CAPTURE_TOO_LARGE')
    // Resize the frozen photo so encoding never captures a later liveness movement.
    frame = canvas
    rectangle = null
    const ratio = Math.min(0.85, Math.sqrt(maxCapturePhotoBytes / encodedBytes) * 0.95)
    const scale = Math.max(minimumResizeSide / longestSide, ratio)
    size = {
      width: Math.max(1, Math.round(size.width * scale)),
      height: Math.max(1, Math.round(size.height * scale)),
    }
  }
}

export function grabVideoFrame(
  video: HTMLVideoElement | null,
  crop?: NormalizedImageCrop,
): Promise<Blob> {
  if (!video || !video.videoWidth || !video.videoHeight) {
    return Promise.reject(new Error('CAMERA_NOT_READY'))
  }

  return drawToJpeg(video, video.videoWidth, video.videoHeight, crop)
}

export async function fileToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    return await drawToJpeg(bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}

export function grabPreviewFrame(video: HTMLVideoElement | null): Promise<Blob> {
  if (!video || !video.videoWidth || !video.videoHeight)
    return Promise.reject(new Error('CAMERA_NOT_READY'))
  const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight))
  return drawToJpeg(
    video,
    Math.max(1, Math.round(video.videoWidth * scale)),
    Math.max(1, Math.round(video.videoHeight * scale)),
  )
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function attachStream(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (video && video.srcObject !== stream) video.srcObject = stream
}
