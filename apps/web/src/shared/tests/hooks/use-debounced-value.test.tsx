import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebouncedValue } from '@shared/hooks/use-debounced-value'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns the initial value and waits for the last edit before updating', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: '' },
    })
    expect(result.current).toBe('')
    rerender({ value: 'Horiz' })
    act(() => vi.advanceTimersByTime(250))
    rerender({ value: 'Horizonte' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('Horizonte')
  })

  it('cancels the pending update on unmount', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: '' },
    })
    rerender({ value: 'agency' })
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
