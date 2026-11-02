import { drawToJpeg, grabVideoFrame } from './image-capture'
import { maxCapturePhotoBytes, maxCapturePhotoSide } from './upload-limits'
import { isCameraConstraintError } from './camera-constraints'
import type { NormalizedImageCrop } from '../types/image-crop.types'

async function nativePhoto(track: MediaStreamTrack, signal: AbortSignal) {
  const capture = new ImageCapture(track)
  let settings: PhotoSettings | undefined
  try {
    const capabilities = await capture.getPhotoCapabilities()
    const width = capabilities.imageWidth?.max ?? 0
    const height = capabilities.imageHeight?.max ?? 0
    const scale = Math.min(1, maxCapturePhotoSide / Math.max(width, height))
    if (width > 0 && height > 0) {
      settings = { imageWidth: Math.round(width * scale), imageHeight: Math.round(height * scale) }
    }
  } catch {
    // Some cameras take native photos without exposing the optional capability query.
  }
  signal.throwIfAborted()
  if (!settings) return capture.takePhoto()
  try {
    return await capture.takePhoto(settings)
  } catch (error) {
    signal.throwIfAborted()
    if (!isCameraConstraintError(error)) throw error
    // Independent ranges may not form a valid mode; try the device's default still-photo mode.
    return capture.takePhoto()
  }
}

function boundedPixels(width: number, height: number) {
  const scale = Math.min(1, maxCapturePhotoSide / Math.max(width, height))
  return width * height * scale * scale
}

export async function grabCameraPhoto(
  video: HTMLVideoElement | null,
  stream: MediaStream | null,
  crop?: NormalizedImageCrop,
) {
  const track = stream?.getVideoTracks()[0]
  if (track && track.readyState === 'live' && typeof ImageCapture !== 'undefined') {
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    try {
      const image = await Promise.race([
        nativePhoto(track, controller.signal),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            controller.abort()
            reject(new Error('PHOTO_TIMEOUT'))
          }, 2500)
        }),
      ])
      const bitmap = await createImageBitmap(image)
      try {
        if (
          video &&
          (boundedPixels(bitmap.width, bitmap.height) <
            boundedPixels(video.videoWidth, video.videoHeight) ||
            // A native photo can use a different sensor area from the preview. Use the
            // video frame when proportions differ so the guide still describes the crop.
            (crop &&
              Math.abs(bitmap.width / bitmap.height - video.videoWidth / video.videoHeight) > 0.01))
        ) {
          return await grabVideoFrame(video, crop)
        }
        if (
          !crop &&
          image.type === 'image/jpeg' &&
          image.size > 0 &&
          image.size <= maxCapturePhotoBytes &&
          Math.max(bitmap.width, bitmap.height) <= maxCapturePhotoSide
        )
          return image
        return await drawToJpeg(bitmap, bitmap.width, bitmap.height, crop)
      } finally {
        bitmap.close()
      }
    } catch {
      // Still photography is optional, even when the browser exposes ImageCapture.
    } finally {
      controller.abort()
      clearTimeout(timer)
    }
  }
  return grabVideoFrame(video, crop)
}
