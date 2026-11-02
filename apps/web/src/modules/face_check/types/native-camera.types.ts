export interface CameraTrackCapabilities extends MediaTrackCapabilities {
  resizeMode?: string[]
  focusMode?: string[]
}

export interface BrowserFaceDetector {
  detect(image: ImageBitmap): Promise<{ boundingBox: DOMRectReadOnly }[]>
}

export type BrowserFaceDetectorConstructor = new (options: {
  fastMode: boolean
  maxDetectedFaces: number
}) => BrowserFaceDetector
