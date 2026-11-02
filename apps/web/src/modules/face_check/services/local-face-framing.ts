import type { FaceFramingResult } from '../types/face-framing.types'
import type { BrowserFaceDetectorConstructor } from '../types/native-camera.types'

export async function localFaceFraming(image: Blob): Promise<FaceFramingResult> {
  const NativeFaceDetector = (
    globalThis as typeof globalThis & {
      FaceDetector?: BrowserFaceDetectorConstructor
    }
  ).FaceDetector
  if (!NativeFaceDetector) throw new Error('LOCAL_FRAMING_UNAVAILABLE')
  const detector = new NativeFaceDetector({ fastMode: true, maxDetectedFaces: 2 })
  const bitmap = await createImageBitmap(image)
  try {
    const faces = await detector.detect(bitmap)
    const box = faces[0]?.boundingBox
    return {
      width: bitmap.width,
      height: bitmap.height,
      faceCount: faces.length,
      face: box
        ? {
            x: box.x / bitmap.width,
            y: box.y / bitmap.height,
            width: box.width / bitmap.width,
            height: box.height / bitmap.height,
          }
        : null,
    }
  } finally {
    bitmap.close()
  }
}
