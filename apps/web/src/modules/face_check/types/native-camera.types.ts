export interface CameraTrackCapabilities extends MediaTrackCapabilities {
  resizeMode?: string[]
  focusMode?: string[]
  exposureMode?: string[]
  whiteBalanceMode?: string[]
}

export interface CameraTrackConstraints extends MediaTrackConstraints {
  focusMode?: ConstrainDOMString
  exposureMode?: ConstrainDOMString
  whiteBalanceMode?: ConstrainDOMString
}

export interface BrowserFaceDetector {
  detect(image: ImageBitmap): Promise<{ boundingBox: DOMRectReadOnly }[]>
}

export type BrowserFaceDetectorConstructor = new (options: {
  fastMode: boolean
  maxDetectedFaces: number
}) => BrowserFaceDetector
