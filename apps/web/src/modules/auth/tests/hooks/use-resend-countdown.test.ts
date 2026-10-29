import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useResendCountdown } from '../../hooks/use-resend-countdown'

afterEach(() => vi.useRealTimers())
describe('useResendCountdown', () => {
  it('bloqueia reenvio até o prazo, permite reiniciar e cancela o timer ao desmontar', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => useResendCountdown(2))
    expect(result.current.isCountingDown).toBe(true)
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.remainingSeconds).toBe(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current.isCountingDown).toBe(false)
    act(() => result.current.restart())
    expect(result.current.remainingSeconds).toBe(2)
    expect(result.current.isCountingDown).toBe(true)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
