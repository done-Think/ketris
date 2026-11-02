import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { livenessSequenceSchema } from '../schemas/liveness-sequence.schema'
import { captureService } from '../services/capture-service'
import { ApiError } from '../services/api-error'
import type { LivenessSequenceOptions } from '../types/liveness-sequence.types'
import { captureKeys } from './capture-query-keys'
import { useCountdown } from './use-countdown'

export function useLivenessSequence(options: LivenessSequenceOptions) {
  const { token, enabled } = options
  const client = useQueryClient()
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

  const start = async () => {
    if (!enabled || active.current || document.hidden) return
    options.prepareSound()
    const controller = new AbortController()
    const { signal } = controller
    active.current = controller
    setRunning(true)
    setStarted(true)
    setError(null)
    try {
      const response = await captureService.startLiveness(token, signal)
      signal.throwIfAborted()
      const parsed = livenessSequenceSchema.safeParse(response)
      if (!parsed.success) throw new ApiError('ANALYSIS_INVALID_RESPONSE', 502)
      const issued = parsed.data
      client.setQueryData(captureKeys.challenges(token), issued.challenges)
      options.onProgress(issued.step + 1)
      for (let index = issued.step; index < issued.challenges.length; index++) {
        await countDown(signal, options.tickSound)
        const result = await options.capture(issued.challenges[index], signal)
        signal.throwIfAborted()
        if (result.remaining !== issued.challenges.length - index - 1)
          throw new ApiError('ANALYSIS_INVALID_RESPONSE', 502)
        options.onProgress(index + 2)
      }
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
