import type { DocumentOrientation } from '../types/capture.types'
import type { NormalizedImageCrop } from '../types/image-crop.types'

export function documentGuideAspect(orientation: DocumentOrientation) {
  return orientation === 'portrait' ? 1 / 1.55 : 1.55
}

export function documentGuideCrop(
  orientation: DocumentOrientation,
  videoAspect: number | null,
): NormalizedImageCrop {
  const aspect = videoAspect ?? 4 / 3
  const guideAspect = documentGuideAspect(orientation)
  const width = 0.84 * Math.min(1, guideAspect / aspect)
  const height = (width * aspect) / guideAspect
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height }
}
