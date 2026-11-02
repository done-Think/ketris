import { maxCapturePhotoSide } from './upload-limits'
import type { CameraTrackCapabilities } from '../types/native-camera.types'

export async function configureCameraQuality(track: MediaStreamTrack) {
  try {
    const capabilities: CameraTrackCapabilities | undefined = track.getCapabilities?.()
    const settings = track.getSettings()
    const width = Math.min(capabilities?.width?.max ?? 0, maxCapturePhotoSide)
    const height = Math.min(capabilities?.height?.max ?? 0, maxCapturePhotoSide)
    if (!width || !height || ((settings.width ?? 0) >= width && (settings.height ?? 0) >= height))
      return
    // Capabilities describe the actual device. Do not invent pixels by scaling the preview.
    await track.applyConstraints({
      width: { ideal: width },
      height: { ideal: height },
      ...(capabilities.resizeMode?.includes('none') ? { resizeMode: { exact: 'none' } } : {}),
      ...(capabilities.focusMode?.includes('continuous') ? { focusMode: 'continuous' } : {}),
      frameRate: { ideal: 24, max: 30 },
    })
  } catch {
    // Independent capability ranges do not guarantee every width/height combination.
    // Keep the already opened stream when the device cannot negotiate another mode.
  }
}
