import { maxCapturePhotoBytes } from './upload-limits'

const maxSidePx = 1600
const jpegQuality = 0.92

function scaledSize(width: number, height: number) {
  const scale = Math.min(1, maxSidePx / Math.max(width, height))

  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function drawToJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<Blob> {
  const size = scaledSize(width, height)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('CANVAS_UNAVAILABLE'))
  context.drawImage(source, 0, 0, size.width, size.height)

  const encode = (quality: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('CAPTURE_FAILED'))),
        'image/jpeg',
        quality,
      ),
    )
  return (async () => {
    for (const quality of [jpegQuality, 0.82, 0.72, 0.62]) {
      const blob = await encode(quality)
      if (blob.size <= maxCapturePhotoBytes) return blob
    }
    throw new Error('CAPTURE_TOO_LARGE')
  })()
}

export function grabVideoFrame(video: HTMLVideoElement | null): Promise<Blob> {
  if (!video || !video.videoWidth || !video.videoHeight) {
    return Promise.reject(new Error('CAMERA_NOT_READY'))
  }

  return drawToJpeg(video, video.videoWidth, video.videoHeight)
}

export async function fileToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    return await drawToJpeg(bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function attachStream(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (video && video.srcObject !== stream) video.srcObject = stream
}
