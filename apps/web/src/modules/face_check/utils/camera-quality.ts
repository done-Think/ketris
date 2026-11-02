import { maxCapturePhotoSide } from './upload-limits'
import type { CameraTrackCapabilities, CameraTrackConstraints } from '../types/native-camera.types'

async function applyQualitySetting(track: MediaStreamTrack, update: CameraTrackConstraints) {
  try {
    // applyConstraints replaces previous constraints. Preserve the selected camera and native mode.
    await track.applyConstraints({ ...track.getConstraints(), ...update })
  } catch {
    // A device may advertise a setting it cannot apply in the current capture mode.
    // Keep the working stream and continue negotiating independent quality controls.
  }
}

export async function configureCameraQuality(track: MediaStreamTrack) {
  try {
    const capabilities: CameraTrackCapabilities | undefined = track.getCapabilities?.()
    const settings = track.getSettings()
    const width = Math.min(capabilities?.width?.max ?? 0, maxCapturePhotoSide)
    const height = Math.min(capabilities?.height?.max ?? 0, maxCapturePhotoSide)
    if (width && height && ((settings.width ?? 0) < width || (settings.height ?? 0) < height)) {
      await applyQualitySetting(track, {
        width: { ideal: width },
        height: { ideal: height },
        ...(capabilities?.resizeMode?.includes('none') ? { resizeMode: { ideal: 'none' } } : {}),
        frameRate: { ideal: 24, max: 30 },
      })
    }
    // Focus, exposure and white balance matter even at the camera's maximum resolution.
    // Negotiate separately so one unsupported control cannot discard the others.
    for (const mode of ['focusMode', 'exposureMode', 'whiteBalanceMode'] as const) {
      if (capabilities?.[mode]?.includes('continuous')) {
        await applyQualitySetting(track, { [mode]: 'continuous' })
      }
    }
  } catch {
    // Capability enumeration is optional; it must never make a usable camera fail.
  }
}
