import { useCallback, useState } from 'react'
import { abortableDelay } from '../utils/abortable-delay'

export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const clear = useCallback(() => setRemaining(null), [])
  const run = useCallback(
    async (signal: AbortSignal, tick: () => void) => {
      for (let value = seconds; value > 0; value--) {
        signal.throwIfAborted()
        setRemaining(value)
        tick()
        await abortableDelay(1000, signal)
      }
      signal.throwIfAborted()
      setRemaining(null)
    },
    [seconds],
  )
  return { remaining, run, clear }
}
