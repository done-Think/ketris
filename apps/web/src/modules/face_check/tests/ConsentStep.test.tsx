import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConsentStep } from '../components/capture/steps/ConsentStep'
import { useConsent } from '../hooks/use-capture-mutations'
import type { CaptureSessionView } from '../types'

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const messages = (await import('@/i18n/messages/pt-BR/face_check.json')).default
  return {
    ...actual,
    useTranslations: (
      namespace: 'face_check.capture.consent' | 'face_check.capture' = 'face_check.capture',
    ) =>
      actual.createTranslator({ locale: 'pt-BR', messages: { face_check: messages }, namespace }),
  }
})
vi.mock('../hooks/use-capture-mutations', () => ({ useConsent: vi.fn() }))
vi.mock('../stores/CaptureFlowProvider', () => ({ useCaptureFlow: () => vi.fn() }))
vi.mock('../components/capture/CaptureLayout', () => ({
  CaptureLayout: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
    <main>
      {children}
      {footer}
    </main>
  ),
}))

const session: CaptureSessionView = {
  token: 'token',
  agencyName: 'Agency',
  reference: 'Property',
  acceptedDocument: 'ANY',
  status: 'CREATED',
  captureMode: 'camera',
  allowGalleryUpload: false,
  attemptsLeft: 3,
  maxAttempts: 3,
  expiresAt: '2026-11-08T12:00:00Z',
  redoReason: null,
}

describe('capture privacy consent', () => {
  afterEach(() => vi.resetAllMocks())

  it('requires the modal acknowledgement before requesting consent or opening the camera', async () => {
    const mutate = vi.fn()
    vi.mocked(useConsent).mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useConsent>)
    const user = userEvent.setup()
    render(<ConsentStep session={session} />)
    await user.click(screen.getByRole('button', { name: 'Começar' }))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(
      screen.getByText(
        'Suas imagens serão usadas apenas nesta verificação, com acesso restrito e sem divulgação pública. Elas serão excluídas ao concluir a validação ou, se houver revisão manual, em até 7 dias.',
      ),
    ).toBeVisible()
    const next = screen.getByRole('button', { name: 'Continuar' })
    expect(next).toBeDisabled()
    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    await user.click(screen.getByRole('checkbox', { name: 'Entendi e estou de acordo!' }))
    expect(next).toBeEnabled()
    await user.click(next)
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
  })
})
