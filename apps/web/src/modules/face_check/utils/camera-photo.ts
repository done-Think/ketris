import { drawToJpeg, grabVideoFrame } from './image-capture'
import { maxCapturePhotoBytes, maxCapturePhotoSide } from './upload-limits'

async function nativePhoto(track: MediaStreamTrack) {
  const capture = new ImageCapture(track)
  const capabilities = await capture.getPhotoCapabilities()
  const width = capabilities.imageWidth?.max ?? 0
  const height = capabilities.imageHeight?.max ?? 0
  const scale = Math.min(1, maxCapturePhotoSide / Math.max(width, height))
  return capture.takePhoto(
    width > 0 && height > 0
      ? { imageWidth: Math.round(width * scale), imageHeight: Math.round(height * scale) }
      : undefined,
  )
}

export async function grabCameraPhoto(video: HTMLVideoElement | null, stream: MediaStream | null) {
  const track = stream?.getVideoTracks()[0]
  if (track && track.readyState === 'live' && typeof ImageCapture !== 'undefined') {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const image = await Promise.race([
        nativePhoto(track),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('PHOTO_TIMEOUT')), 2500)
        }),
      ])
      const bitmap = await createImageBitmap(image)
      try {
        if (
          image.type === 'image/jpeg' &&
          image.size > 0 &&
          image.size <= maxCapturePhotoBytes &&
          Math.max(bitmap.width, bitmap.height) <= maxCapturePhotoSide
        )
          return image
        return await drawToJpeg(bitmap, bitmap.width, bitmap.height)
      } finally {
        bitmap.close()
      }
    } catch {
      // Still photography is optional, even when the browser exposes ImageCapture.
    } finally {
      clearTimeout(timer)
    }
  }
  return grabVideoFrame(video)
}
