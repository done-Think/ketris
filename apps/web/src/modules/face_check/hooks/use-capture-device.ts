import { useEffect, useState } from 'react'
import type { CaptureDevice } from '../types/face-framing.types'

export function useCaptureDevice(): CaptureDevice {
  const [device, setDevice] = useState<CaptureDevice>('camera')
  useEffect(() => {
    const hints =
      'userAgentData' in navigator ? (navigator.userAgentData as { mobile?: boolean }) : undefined
    const mobile =
      hints?.mobile === true ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setDevice(mobile ? 'mobile' : 'computer')
  }, [])
  return device
}
