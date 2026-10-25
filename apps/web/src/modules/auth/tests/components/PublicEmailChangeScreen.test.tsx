import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PublicEmailChangeScreen } from '../../components/PublicEmailChangeScreen'
import { emailChangeService } from '../../services/email-change-service'
import { AuthQueryTestProvider } from '../fixtures/auth-query-provider'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('next-auth/react', () => ({ signOut }))
vi.mock('../../services/email-change-service', () => ({
  emailChangeService: { confirmPublic: vi.fn() },
}))

function renderPage(requestId: string | null = 'opaque-request') {
  render(
    <ThemeProvider theme={theme}>
      <AuthQueryTestProvider>
        <PublicEmailChangeScreen requestId={requestId} />
      </AuthQueryTestProvider>
    </ThemeProvider>,
  )
}

describe('PublicEmailChangeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(emailChangeService.confirmPublic).mockResolvedValue(undefined)
  })

  it('requires the six-digit proof and keeps any existing session after success', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar novo e-mail' }))
    await waitFor(() => expect(emailChangeService.confirmPublic).not.toHaveBeenCalled())
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar novo e-mail' }))
    await screen.findByText(
      'E-mail confirmado. Para acessar esta conta novamente, entre usando o novo endereço.',
    )
    expect(emailChangeService.confirmPublic).toHaveBeenCalledTimes(1)
    expect(emailChangeService.confirmPublic).toHaveBeenCalledWith({
      requestId: 'opaque-request',
      code: '123456',
    })
    expect(signOut).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not call the API when the link has no request identifier', () => {
    renderPage(null)
    expect(
      screen.getByText(
        'Este link de confirmação é inválido. Peça uma nova solicitação de alteração de e-mail.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(emailChangeService.confirmPublic).not.toHaveBeenCalled()
  })

  it('translates an invalid proof response and keeps the form available', async () => {
    vi.mocked(emailChangeService.confirmPublic).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code: 'INVALID_EMAIL_VERIFICATION_CODE' } } },
    })
    renderPage()
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar novo e-mail' }))
    await screen.findByText(
      'Código inválido ou expirado. Confira os seis dígitos ou peça uma nova solicitação.',
    )
    expect(screen.getAllByRole('textbox')).toHaveLength(6)
    expect(signOut).not.toHaveBeenCalled()
  })
})
