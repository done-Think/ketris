import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OverflowTooltipText } from '@shared/components/ui/OverflowTooltipText'

let contentWidth = 200
let notifyResize = () => {}

beforeEach(() => {
  contentWidth = 200
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100)
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => contentWidth)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        notifyResize = callback
      }
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('OverflowTooltipText', () => {
  it('shows the full text on hover when the column truncates it', async () => {
    const user = userEvent.setup()
    render(<OverflowTooltipText>Full property address</OverflowTooltipText>)

    await user.hover(screen.getByText('Full property address'))

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Full property address')
  })

  it('does not show a tooltip when the text fits', async () => {
    contentWidth = 100
    const user = userEvent.setup()
    render(<OverflowTooltipText>Short text</OverflowTooltipText>)

    const text = screen.getByText('Short text')
    await user.hover(text)

    expect(text).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('supports keyboard focus and rechecks truncation when resized', async () => {
    const user = userEvent.setup()
    render(<OverflowTooltipText>Full property address</OverflowTooltipText>)

    await user.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Full property address')

    contentWidth = 80
    act(() => notifyResize())

    expect(screen.getByText('Full property address')).not.toHaveAttribute('tabindex')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })
})
