import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FaceCheckCapturePage } from '../components/FaceCheckPages'
import { useCaptureSession } from '../hooks/use-capture-queries'

vi.mock('../hooks/use-capture-queries', async () => ({
  ...(await vi.importActual<typeof import('../hooks/use-capture-queries')>(
    '../hooks/use-capture-queries',
  )),
  useCaptureSession: vi.fn(),
}))

describe('public capture presentation prop', () => {
  beforeEach(() => {
    vi.mocked(useCaptureSession, { partial: true }).mockReturnValue({ isPending: true })
  })

  it('keeps the standalone presentation as the default', () => {
    const view = render(<FaceCheckCapturePage token="token" />)
    expect(view.container.querySelector('[data-capture-presentation="standalone"]')).not.toBeNull()
    expect(screen.getByRole('progressbar', { name: 'Carregando verificação' })).toBeVisible()
  })

  it('passes dashboard presentation through to loading content without an extra main landmark', () => {
    const view = render(
      <main aria-label="Dashboard">
        <FaceCheckCapturePage token="token" variant="dashboard" />
      </main>,
    )
    expect(view.container.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getByRole('region', { name: 'Verificação de identidade' })).toHaveAttribute(
      'data-capture-presentation',
      'dashboard',
    )
    expect(screen.getByRole('progressbar', { name: 'Carregando verificação' })).toBeVisible()
  })
})
