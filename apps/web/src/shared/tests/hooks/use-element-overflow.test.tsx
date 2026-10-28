import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useElementOverflow } from '@shared/hooks/use-element-overflow'

describe('useElementOverflow', () => {
  afterEach(() => vi.unstubAllGlobals())

  function elements(width = 140, containerWidth = 100) {
    const container = document.createElement('div')
    const element = document.createElement('img')
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: containerWidth })
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, width, 0))
    return { container, element }
  }

  it('measures resized content and clears overflow when it fits', () => {
    let notify: () => void = () => undefined
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback
        }
        observe = observe
        disconnect = disconnect
      },
    )
    const { result, rerender, unmount } = renderHook(
      ({ key }) => useElementOverflow<HTMLImageElement>(key),
      { initialProps: { key: 'initial' } },
    )
    const { container, element } = elements()
    result.current.containerRef.current = container
    result.current.elementRef.current = element
    rerender({ key: 'loaded' })
    expect(observe).toHaveBeenCalledWith(container)
    expect(observe).toHaveBeenCalledWith(element)
    expect(result.current.overflow).toBe(40)

    vi.mocked(element.getBoundingClientRect).mockReturnValue(new DOMRect(0, 0, 80, 0))
    act(() => notify())
    expect(result.current.overflow).toBe(0)
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })

  it('remeasures when a layout changes even if no resize is reported', () => {
    const { result, rerender } = renderHook(
      ({ layout }) => useElementOverflow<HTMLImageElement>('image', layout),
      { initialProps: { layout: 'compact' } },
    )
    const { container, element } = elements()
    result.current.containerRef.current = container
    result.current.elementRef.current = element
    rerender({ layout: 'wide' })
    expect(result.current.overflow).toBe(40)
    Object.defineProperty(container, 'clientWidth', { configurable: true, value: 180 })
    rerender({ layout: 'compact' })
    expect(result.current.overflow).toBe(0)
  })

  it('supports window resize when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const { result } = renderHook(() => useElementOverflow<HTMLImageElement>())
    const { container, element } = elements()
    result.current.containerRef.current = container
    result.current.elementRef.current = element
    act(() => window.dispatchEvent(new Event('resize')))
    expect(result.current.overflow).toBe(40)
  })
})
