import { useEffect, useState } from 'react'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import { faceFramingStatus } from '../utils/face-framing'
import type { FaceFramingStatus, SelfieFramingOptions } from '../types/face-framing.types'

const sampleIntervalMs = 1500
const rateLimitDelayMs = 60_000
const stableSamples = 2

export function useSelfieFraming({ token, enabled, sampleFrame, geometry }: SelfieFramingOptions) {
  const [feedback, setFeedback] = useState<{ token: string; status: FaceFramingStatus }>({
    token,
    status: 'checking',
  })
  useEffect(() => {
    if (!enabled || !geometry) return
    setFeedback({ token, status: 'checking' })
    let cancelled = false
    let readySamples = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    const sample = async () => {
      controller = new AbortController()
      let delay = sampleIntervalMs
      try {
        const image = await sampleFrame()
        if (cancelled) return
        const result = await captureService.framing(token, image, controller.signal)
        if (cancelled) return
        const measured = faceFramingStatus(result, geometry)
        readySamples = measured === 'ready' ? readySamples + 1 : 0
        setFeedback({
          token,
          status: measured === 'ready' && readySamples < stableSamples ? 'checking' : measured,
        })
      } catch (error) {
        if (cancelled) return
        readySamples = 0
        setFeedback({ token, status: 'unavailable' })
        if (error instanceof ApiError) {
          if ([401, 404, 410].includes(error.status) || error.code === 'INVALID_CAPTURE_STATE')
            return
          if (error.status === 429) delay = rateLimitDelayMs
        }
      }
      if (!cancelled)
        timer = setTimeout(() => {
          void sample()
        }, delay)
    }
    void sample()
    return () => {
      cancelled = true
      clearTimeout(timer)
      controller?.abort()
    }
  }, [token, enabled, sampleFrame, geometry])
  return enabled && geometry && feedback.token === token ? feedback.status : 'checking'
}
