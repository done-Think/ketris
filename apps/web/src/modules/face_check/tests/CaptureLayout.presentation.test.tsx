import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CaptureLayout } from '../components/capture/CaptureLayout'
import { CapturePresentationProvider } from '../stores/CapturePresentationProvider'

describe('capture presentation inside and outside the dashboard', () => {
  it('defaults to the standalone header and preserves private content and actions', async () => {
    const onBack = vi.fn()
    const view = render(
      <CaptureLayout
        progressStep="document"
        onBack={onBack}
        footer={<button type="button">Continue capture</button>}
      >
        <h1>Document capture</h1>
      </CaptureLayout>,
    )
    expect(view.container.querySelectorAll('main')).toHaveLength(1)
    expect(view.container.querySelector('header')).not.toBeNull()
    expect(
      view.container.querySelector('[data-capture-presentation="standalone"]'),
    ).toHaveAttribute('data-face-check-private', 'true')
    expect(view.container.querySelector('[data-capture-presentation="standalone"]')).toHaveClass(
      'sentry-block',
    )
    expect(screen.getByRole('button', { name: 'Continue capture' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('uses a private section in the dashboard without nesting main or duplicating the brand header', () => {
    const view = render(
      <main aria-label="Dashboard">
        <CapturePresentationProvider variant="dashboard">
          <CaptureLayout
            progressStep="consent"
            footer={<button type="button">Start capture</button>}
          >
            <h1>Consent</h1>
          </CaptureLayout>
        </CapturePresentationProvider>
      </main>,
    )
    expect(view.container.querySelectorAll('main')).toHaveLength(1)
    const section = screen.getByRole('region', { name: 'Verificação de identidade' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('data-face-check-private', 'true')
    expect(section).toHaveClass('sentry-block')
    expect(section.querySelector('header')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Consent' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Start capture' })).toBeVisible()
  })
})
