import type { CaptureMode } from '@server/face_check/types/session.types'

export const consentTermsVersion: Record<CaptureMode, string> = {
  camera: 'camera-2026-10-31-retention-v1',
  simulated: 'demo-2026-10-29',
  local: 'local-2026-10-29',
}
