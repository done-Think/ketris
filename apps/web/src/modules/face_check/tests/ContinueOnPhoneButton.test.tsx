import { cleanup, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { ContinueOnPhoneButton } from '../components/capture/ContinueOnPhoneButton'
import { CameraFallback } from '../components/capture/CameraFallback'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it.each([
  ['iPhone', 'iPhone Mobile Safari', 5],
  ['Linux', 'Android Mobile Chrome', 5],
  ['MacIntel', 'Macintosh Safari', 5],
] as const)(
  'does not offer a phone handoff when already on %s %s',
  (platform, userAgent, maxTouchPoints) => {
    vi.stubGlobal('navigator', { platform, userAgent, maxTouchPoints })
    render(<ContinueOnPhoneButton token="synthetic-token" />)
    expect(screen.queryByRole('button', { name: 'Continuar pelo celular' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  },
)

it('keeps the phone handoff available on a computer even with a narrow window', () => {
  vi.stubGlobal('navigator', {
    platform: 'MacIntel',
    userAgent: 'Macintosh Chrome',
    maxTouchPoints: 0,
  })
  vi.stubGlobal('innerWidth', 360)
  render(<ContinueOnPhoneButton token="synthetic-token" />)
  expect(screen.getByRole('button', { name: 'Continuar pelo celular' })).toBeVisible()
})

it('does not flash a phone handoff before client-side device detection', () => {
  expect(renderToString(<ContinueOnPhoneButton token="synthetic-token" />)).toBe('')
})

it.each(['starting', 'notFound', 'denied', 'unavailable', 'unsupported', 'insecure'] as const)(
  'does not send a phone user to another phone when the camera is %s',
  (status) => {
    vi.stubGlobal('navigator', {
      platform: 'iPhone',
      userAgent: 'iPhone Mobile Safari',
      maxTouchPoints: 5,
    })
    render(
      <CameraFallback
        token="synthetic-token"
        status={status}
        allowGallery={false}
        onFile={vi.fn()}
        onRetry={vi.fn()}
        onAlternative={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Continuar pelo celular' })).not.toBeInTheDocument()
    expect(screen.queryByText(/continue.*celular/i)).not.toBeInTheDocument()
    if (status === 'denied')
      expect(screen.getByText(/Permita o acesso à câmera nas configurações/)).toBeVisible()
  },
)
