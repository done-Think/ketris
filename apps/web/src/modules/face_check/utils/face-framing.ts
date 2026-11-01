import type {
  FaceFramingResult,
  FaceFramingStatus,
  FaceGuideGeometry,
} from '../types/face-framing.types'

export function faceFramingStatus(
  result: FaceFramingResult,
  viewport: FaceGuideGeometry,
): FaceFramingStatus {
  if (
    ![
      result.width,
      result.height,
      viewport.width,
      viewport.height,
      viewport.guide.width,
      viewport.guide.height,
    ].every((value) => Number.isFinite(value) && value > 0) ||
    !Number.isInteger(result.faceCount) ||
    result.faceCount < 0
  )
    return 'unavailable'
  if (result.faceCount === 0 || !result.face) return 'notFound'
  if (result.faceCount > 1) return 'multipleFaces'
  if (
    ![result.face.x, result.face.y, result.face.width, result.face.height].every(Number.isFinite) ||
    result.face.width <= 0 ||
    result.face.height <= 0
  )
    return 'unavailable'
  const scale = Math.max(viewport.width / result.width, viewport.height / result.height)
  const displayWidth = result.width * scale
  const displayHeight = result.height * scale
  const faceWidth = result.face.width * displayWidth
  const faceHeight = result.face.height * displayHeight
  // Selfie media uses object-fit: cover and a horizontal mirror.
  const left =
    viewport.width -
    (result.face.x * displayWidth - (displayWidth - viewport.width) / 2 + faceWidth)
  const top = result.face.y * displayHeight - (displayHeight - viewport.height) / 2
  const target = viewport.guide
  if (faceWidth > target.width * 1.05 || faceHeight > target.height * 1.05) return 'tooClose'
  if (
    left < 0 ||
    top < 0 ||
    left + faceWidth > viewport.width ||
    top + faceHeight > viewport.height
  )
    return 'offCenter'
  if (
    Math.abs(left + faceWidth / 2 - target.x - target.width / 2) > target.width * 0.18 ||
    Math.abs(top + faceHeight / 2 - target.y - target.height / 2) > target.height * 0.18
  )
    return 'offCenter'
  if (faceWidth < target.width * 0.55 || faceHeight < target.height * 0.55) return 'tooFar'
  return 'ready'
}
