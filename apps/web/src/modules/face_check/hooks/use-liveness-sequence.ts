import { useCallback, useEffect, useRef, useState } from 'react'
import { deferredLivenessPlanSchema } from '../schemas/liveness-sequence.schema'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import type { LivenessSequenceOptions } from '../types/liveness-sequence.types'
import { useCountdown } from './use-countdown'

export function useLivenessSequence(options: LivenessSequenceOptions) {
  const { token, enabled } = options
  const { remaining, run: countDown, clear } = useCountdown(3)
  const active = useRef<AbortController | null>(null)
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const stop = useCallback(() => {
    active.current?.abort()
    active.current = null
    clear()
    setRunning(false)
  }, [clear])

  useEffect(() => {
    stop()
    const onVisibility = () => {
      if (document.hidden) stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      active.current?.abort()
      active.current = null
    }
  }, [token, enabled, stop])

  const start = async (requestedStep = options.localStep) => {
    if (!enabled || active.current || document.hidden) return
    options.prepareSound()
    const controller = new AbortController()
    const { signal } = controller
    active.current = controller
    setRunning(true)
    setStarted(true)
    setError(null)
    try {
      if (!Number.isInteger(requestedStep) || requestedStep < 0 || requestedStep > 3)
        throw new ApiError('INVALID_CAPTURE_STATE', 409)
      const response = await captureService.prepareLiveness(token, !options.planId, signal)
      signal.throwIfAborted()
      const parsed = deferredLivenessPlanSchema.safeParse(response)
      if (!parsed.success) throw new ApiError('ANALYSIS_INVALID_RESPONSE', 502)
      const issued = parsed.data
      if (Date.parse(issued.expiresAt) <= Date.now()) throw new ApiError('SESSION_EXPIRED', 410)
      options.onPlan(issued)
      const from = Math.max(issued.step, options.planId === issued.planId ? requestedStep : 0)
      options.onProgress(from + 1)
      if (from >= issued.challenges.length) return
      await countDown(signal, options.tickSound)
      await options.capture(issued.challenges[from], signal)
      signal.throwIfAborted()
    } catch (failure) {
      if (!signal.aborted) setError(failure)
    } finally {
      if (active.current === controller) {
        active.current = null
        clear()
        setRunning(false)
      }
    }
  }
  return {
    running,
    started,
    error,
    remaining,
    start,
    stop,
    reset: () => {
      stop()
      setStarted(false)
      setError(null)
    },
  }
}
