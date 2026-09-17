'use client'

import { useCallback, useEffect, useState } from 'react'

export function useResendCountdown(seconds: number) {
  const [remainingSeconds, setRemainingSeconds] = useState(seconds)

  useEffect(() => {
    if (remainingSeconds <= 0) return

    const timer = setTimeout(() => {
      setRemainingSeconds((current) => current - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [remainingSeconds])

  const restart = useCallback(() => {
    setRemainingSeconds(seconds)
  }, [seconds])

  return {
    remainingSeconds,
    isCountingDown: remainingSeconds > 0,
    restart,
  }
}
