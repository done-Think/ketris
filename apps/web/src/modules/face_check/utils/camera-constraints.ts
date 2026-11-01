import type { CameraFacing } from '../types/capture.types'
import { maxCapturePhotoSide } from './upload-limits'

export function cameraConstraints(facing: CameraFacing, requireHd: boolean) {
  return {
    audio: false,
    video: {
      facingMode: { ideal: facing },
      width: { ideal: maxCapturePhotoSide, ...(requireHd ? { min: 1280 } : {}) },
      height: { ideal: 2160, ...(requireHd ? { min: 720 } : {}) },
      // Prefer native camera frames instead of browser cropping or scaling.
      resizeMode: { ideal: 'none' },
      frameRate: { ideal: 30, max: 30 },
    },
  }
}

export function isCameraConstraintError(error: unknown) {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : null
  return name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError'
}
