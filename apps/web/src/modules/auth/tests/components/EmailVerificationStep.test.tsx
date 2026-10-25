import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmailVerificationStep } from '../../components/EmailVerificationStep'
import { authService } from '../../services/auth-service'
import { AuthQueryTestProvider } from '../fixtures/auth-query-provider'

vi.mock('../../services/auth-service', () => ({
  authService: { confirmSignupCode: vi.fn(), requestSignupCode: vi.fn() },
}))
const verification = {
  outcome: 'PENDING_EMAIL_VERIFICATION' as const,
  email: 'ana@ketris.dev',
  tenantId: 't1',
  emailSent: true,
}
const confirmed = { outcome: 'PENDING_APPROVAL' as const, email: verification.email }
function renderStep(onConfirmed = vi.fn().mockResolvedValue(undefined)) {
  return {
    onConfirmed,
    ...render(
      <AuthQueryTestProvider>
        <EmailVerificationStep verification={verification} onConfirmed={onConfirmed} />
      </AuthQueryTestProvider>,
    ),
  }
}
async function submitCode() {
  const user = userEvent.setup()
  await user.type(screen.getAllByLabelText(/Código de verificação/)[0], '123456')
  await user.click(screen.getByRole('button', { name: /^Confirmar$/ }))
}

describe('EmailVerificationStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.confirmSignupCode).mockResolvedValue(confirmed)
  })
  it('exige código completo e valida no servidor antes de concluir; não permite pular', async () => {
    const { onConfirmed } = renderStep()
    expect(screen.getByText(/ana@ketris\.dev/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Confirmar$/ })).toBeDisabled()
    expect(screen.queryByText('Confirmar depois')).not.toBeInTheDocument()
    expect(onConfirmed).not.toHaveBeenCalled()
    await submitCode()
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(confirmed))
    expect(authService.confirmSignupCode).toHaveBeenCalledWith({
      email: verification.email,
      tenantId: 't1',
      code: '123456',
    })
  })
  it('rejeita código inválido sem concluir nem criar sessão', async () => {
    vi.mocked(authService.confirmSignupCode).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { code: 'INVALID_EMAIL_VERIFICATION_CODE' } } },
    })
    const { onConfirmed } = renderStep()
    await submitCode()
    expect(await screen.findByText(/Código inválido, expirado/)).toBeInTheDocument()
    expect(onConfirmed).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /^Confirmar$/ })).toBeEnabled()
  })
  it('se a sessão falhar após confirmar, oferece login sem reutilizar o código consumido', async () => {
    const onConfirmed = vi.fn().mockRejectedValue(new Error('session failed'))
    renderStep(onConfirmed)
    await submitCode()
    expect(
      await screen.findByText(/E-mail confirmado. Não foi possível iniciar a sessão/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Confirmar$/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login')
  })
})
