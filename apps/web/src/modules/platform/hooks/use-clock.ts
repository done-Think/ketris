import { useCallback, useSyncExternalStore } from 'react'

export function useClock(intervalMs: number): number | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const interval = window.setInterval(onChange, intervalMs)
      return () => window.clearInterval(interval)
    },
    [intervalMs],
  )

  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  )
}
