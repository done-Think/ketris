import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBrowserLocation } from '../../hooks/use-browser-location'

function provider() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function LocationQueryProvider({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}
afterEach(() => vi.unstubAllGlobals())

describe('browser location', () => {
  it('requests one position and reuses it when switching search pages', async () => {
    const getCurrentPosition = vi.fn((success) =>
      success({ coords: { latitude: -22.425, longitude: -45.453 } }),
    )
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    const wrapper = provider()
    const first = renderHook(() => useBrowserLocation(), { wrapper })
    await waitFor(() =>
      expect(first.result.current.data).toEqual({ latitude: -22.425, longitude: -45.453 }),
    )
    first.unmount()
    const second = renderHook(() => useBrowserLocation(), { wrapper })
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  })
  it('does not prompt for an explicit city search', () => {
    const getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    renderHook(() => useBrowserLocation(false), { wrapper: provider() })
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })
  it.each([1, 2, 3])(
    'does not retry denied, unavailable or timed out requests (%s)',
    async (code) => {
      const getCurrentPosition = vi.fn((_success, error) => error({ code }))
      vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
      const wrapper = provider()
      const first = renderHook(() => useBrowserLocation(), { wrapper })
      await waitFor(() => expect(first.result.current.isError).toBe(true))
      first.unmount()
      const second = renderHook(() => useBrowserLocation(), { wrapper })
      await waitFor(() => expect(second.result.current.isError).toBe(true))
      expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    },
  )
  it('handles browsers without geolocation', async () => {
    vi.stubGlobal('navigator', {})
    const { result } = renderHook(() => useBrowserLocation(), { wrapper: provider() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
