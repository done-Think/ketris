import { useCallback, useEffect, useState } from 'react'

import type { FaceProximityOptions } from '../types/capture.types'
import { captureService } from '../services/capture-service'

const sampleDelayMs = 1000
const stableSamples = 2

export function useFaceProximity({ token, enabled, grabFrame }: FaceProximityOptions) {
  const [feedback, setFeedback] = useState({ token, ready: false })
  const reset = useCallback(() => setFeedback({ token, ready: false }), [token])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let consecutive = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let request: AbortController | undefined
    const sample = async () => {
      request = new AbortController()
      try {
        const image = await grabFrame()
        if (cancelled) return
        const result = await captureService.proximity(token, image, request.signal)
        if (cancelled) return
        consecutive = result.ready ? consecutive + 1 : 0
        setFeedback({ token, ready: consecutive >= stableSamples })
      } catch {
        if (cancelled) return
        consecutive = 0
        setFeedback({ token, ready: false })
      }
      if (!cancelled)
        timer = setTimeout(() => {
          void sample()
        }, sampleDelayMs)
    }
    void sample()
    return () => {
      cancelled = true
      clearTimeout(timer)
      request?.abort()
    }
  }, [enabled, grabFrame, token])

  return { ready: enabled && feedback.token === token && feedback.ready, reset }
}
