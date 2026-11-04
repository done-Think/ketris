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

export interface FaceGuideGeometry {
  width: number
  height: number
  guide: FaceFrameBounds
}

export type FaceFramingStatus =
  | 'checking'
  | 'notFound'
  | 'multipleFaces'
  | 'tooFar'
  | 'tooClose'
  | 'offCenter'
  | 'ready'
  | 'unavailable'
export type CaptureDevice = 'camera' | 'computer' | 'mobile'

export interface SelfieFramingOptions {
  localOnly?: boolean
  token: string
  enabled: boolean
  sampleFrame: () => Promise<Blob>
  geometry: FaceGuideGeometry | null
}
