import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useElementOverflow } from '@shared/hooks'

const observers: { callback: () => void; disconnect: ReturnType<typeof vi.fn> }[] = []

function Probe({ source }: { source: string }) {
  const { containerRef, contentRef, overflow } = useElementOverflow<
    HTMLDivElement,
    HTMLSpanElement
  >([source])

  return (
    <div ref={containerRef} data-testid="container">
      <span ref={contentRef} data-testid="content">
        {source}
      </span>
      <output>{overflow}</output>
    </div>
  )
}

function size(containerWidth: number, contentWidth: number) {
  Object.defineProperty(screen.getByTestId('container'), 'clientWidth', {
    configurable: true,
    value: containerWidth,
  })
  vi.spyOn(screen.getByTestId('content'), 'getBoundingClientRect').mockReturnValue({
    width: contentWidth,
  } as DOMRect)
}

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = vi.fn()
      constructor(callback: () => void) {
        observers.push({ callback, disconnect: this.disconnect })
      }
      observe() {}
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('useElementOverflow', () => {
  it('reports how much wider the content is and never a negative value', () => {
    render(<Probe source="logo-a" />)

    size(100, 160)
    act(() => observers.at(-1)!.callback())
    expect(screen.getByRole('status')).toHaveTextContent('60')

    size(100, 80)
    act(() => observers.at(-1)!.callback())
    expect(screen.getByRole('status')).toHaveTextContent('0')
  })

  it('observes again when its dependencies change and stops on unmount', () => {
    const { rerender, unmount } = render(<Probe source="logo-a" />)
    const first = observers.at(-1)!

    rerender(<Probe source="logo-b" />)
    expect(first.disconnect).toHaveBeenCalled()
    expect(observers).toHaveLength(2)

    unmount()
    expect(observers.at(-1)!.disconnect).toHaveBeenCalled()
  })
})
