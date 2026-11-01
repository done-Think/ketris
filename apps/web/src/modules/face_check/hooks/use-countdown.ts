import { useEffect, useRef, useState } from 'react'

export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const onDone = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (remaining === null) return
    const timer = setTimeout(() => {
      if (remaining > 1) {
        setRemaining(remaining - 1)
        return
      }
      const done = onDone.current
      onDone.current = null
      setRemaining(null)
      done?.()
    }, 1000)

    return () => clearTimeout(timer)
  }, [remaining])

  return {
    remaining,
    start: (done: () => void) => {
      onDone.current = done
      setRemaining(seconds)
    },
  }
}
