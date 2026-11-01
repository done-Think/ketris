export interface FaceFrameBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface FaceFramingResult {
  width: number
  height: number
  faceCount: number
  face: FaceFrameBounds | null
}

export interface CapturedImageLimits {
  maxBytes: number
  maxPixels: number
}
