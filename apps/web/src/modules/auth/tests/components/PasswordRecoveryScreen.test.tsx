import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthQueryTestProvider } from '../fixtures/auth-query-provider'

import { PasswordRecoveryScreen } from '../../components/PasswordRecoveryScreen'
import { passwordRecoveryService } from '../../services/password-recovery-service'

vi.mock('../../services/password-recovery-service', () => ({
  passwordRecoveryService: {
    requestCode: vi.fn(),
    verifyCode: vi.fn(),
    resetPassword: vi.fn(),
  },
}))

function axiosErrorWithCode(code: string) {
  return Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: { data: { error: { code } } },
  })
}

async function goToCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  await screen.findByRole('heading', { name: 'Verifique seu e-mail' })
}

async function completeCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await goToCodeStep(user)
  const boxes = screen.getAllByLabelText(/Código de verificação/)
  await user.click(boxes[0])
  await user.type(boxes[0], '123456')
  await screen.findByRole('heading', { name: 'Crie uma nova senha' })
}

describe('PasswordRecoveryScreen', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(passwordRecoveryService.requestCode).mockResolvedValue(undefined)
    vi.mocked(passwordRecoveryService.verifyCode).mockResolvedValue({
      resetToken: 'reset-token-123',
    })
    vi.mocked(passwordRecoveryService.resetPassword).mockResolvedValue(undefined)
  })

  it('exibe a composição principal da recuperação de senha', () => {
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Recuperar senha' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('placeholder', 'seu@email.com')
    expect(screen.getByRole('button', { name: 'Enviar código' })).toBeInTheDocument()
  })

  it('valida o e-mail antes de avançar, sem pedir código nenhum', async () => {
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Enviar código' }))

    expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Verifique seu e-mail' })).not.toBeInTheDocument()
    expect(passwordRecoveryService.requestCode).not.toHaveBeenCalled()
  })

  it('pede o código por e-mail e avança pro passo do código, sem os campos de nova senha juntos', async () => {
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await goToCodeStep(user)

    expect(passwordRecoveryService.requestCode).toHaveBeenCalledWith('usuario@email.com', 'pt-BR')
    expect(screen.getAllByLabelText(/Código de verificação/)).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Reenviar em 1:00' })).toBeDisabled()
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Confirmar nova senha')).not.toBeInTheDocument()
  })

  it('mostra um erro e não avança quando pedir o código falha', async () => {
    vi.mocked(passwordRecoveryService.requestCode).mockRejectedValue(
      axiosErrorWithCode('RATE_LIMIT_EXCEEDED'),
    )

    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
    await user.click(screen.getByRole('button', { name: 'Enviar código' }))

    expect(
      await screen.findByText(
        'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Verifique seu e-mail' })).not.toBeInTheDocument()
  })

  it('verifica o código automaticamente ao completar os 6 dígitos e avança pra nova senha', async () => {
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await completeCodeStep(user)

    expect(passwordRecoveryService.verifyCode).toHaveBeenCalledWith(
      'usuario@email.com',
      '123456',
      undefined,
    )
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument()
    expect(screen.queryAllByLabelText(/Código de verificação/)).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Reenviar/ })).not.toBeInTheDocument()
  })

  it('mostra um erro e limpa o código quando ele está errado ou expirado', async () => {
    vi.mocked(passwordRecoveryService.verifyCode).mockRejectedValue(
      axiosErrorWithCode('INVALID_RESET_CODE'),
    )

    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await goToCodeStep(user)
    const boxes = screen.getAllByLabelText(/Código de verificação/)
    await user.click(boxes[0])
    await user.type(boxes[0], '000000')

    expect(
      await screen.findByText('Código incorreto ou expirado. Confira o código ou peça um novo.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Crie uma nova senha' })).not.toBeInTheDocument()
    expect(boxes[0]).toHaveValue('')
    expect(boxes[0]).toHaveAttribute('aria-invalid', 'true')
  })

  it('exige pelo menos 8 caracteres na nova senha', async () => {
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await completeCodeStep(user)
    await user.type(screen.getByLabelText('Nova senha'), '123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), '123')
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(await screen.findByText('A senha deve ter pelo menos 8 caracteres')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Senha redefinida!' })).not.toBeInTheDocument()
  })

  it('rejeita quando as senhas não coincidem', async () => {
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await completeCodeStep(user)
    await user.type(screen.getByLabelText('Nova senha'), 'senha-longa-123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'outra-senha-123')
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Senha redefinida!' })).not.toBeInTheDocument()
  })

  it('permite mostrar e ocultar a senha digitada, em cada campo de forma independente', async () => {
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await completeCodeStep(user)

    const passwordInput = screen.getByLabelText('Nova senha')
    const confirmationInput = screen.getByLabelText('Confirmar nova senha')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmationInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar Nova senha' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(confirmationInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar Confirmar nova senha' }))
    expect(confirmationInput).toHaveAttribute('type', 'text')
  })

  it('redefine a senha com sucesso, enviando o resetToken obtido na verificação, e mostra a confirmação', async () => {
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await completeCodeStep(user)
    await user.type(screen.getByLabelText('Nova senha'), 'senha-longa-123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'senha-longa-123')
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(await screen.findByRole('heading', { name: 'Senha redefinida!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login')

    expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith({
      email: 'usuario@email.com',
      password: 'senha-longa-123',
      resetToken: 'reset-token-123',
    })
  })

  it('mostra uma mensagem de erro quando a redefinição falha no backend', async () => {
    vi.mocked(passwordRecoveryService.resetPassword).mockRejectedValue(
      axiosErrorWithCode('UNKNOWN'),
    )

    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )

    await completeCodeStep(user)
    await user.type(screen.getByLabelText('Nova senha'), 'senha-longa-123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'senha-longa-123')
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(
      await screen.findByText(
        'Não foi possível redefinir sua senha. Tente novamente em instantes.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Senha redefinida!' })).not.toBeInTheDocument()
  })
  it('only displays accounts after validating the code, then resets the selected account', async () => {
    vi.mocked(passwordRecoveryService.verifyCode)
      .mockResolvedValueOnce({
        outcome: 'SELECT_TENANT',
        tenants: [
          { id: 'tenant-1', name: 'First account', slug: 'first' },
          { id: 'tenant-2', name: 'Second account', slug: 'second' },
        ],
      })
      .mockResolvedValueOnce({ resetToken: 'selected-account-token' })
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )
    expect(screen.queryByText('First account')).not.toBeInTheDocument()
    await goToCodeStep(user)
    expect(screen.queryByText('First account')).not.toBeInTheDocument()
    const boxes = screen.getAllByLabelText(/Código de verificação/)
    await user.type(boxes[0], '123456')
    await screen.findByRole('heading', { name: 'Escolha sua conta' })
    expect(passwordRecoveryService.verifyCode).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('Conta'))
    await user.click(screen.getByRole('option', { name: 'Second account' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    await screen.findByRole('heading', { name: 'Crie uma nova senha' })
    expect(passwordRecoveryService.verifyCode).toHaveBeenLastCalledWith(
      'usuario@email.com',
      '123456',
      'tenant-2',
    )
    await user.type(screen.getByLabelText('Nova senha'), 'new-password')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'new-password')
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))
    await screen.findByRole('heading', { name: 'Senha redefinida!' })
    expect(passwordRecoveryService.resetPassword).toHaveBeenCalledWith({
      email: 'usuario@email.com',
      password: 'new-password',
      resetToken: 'selected-account-token',
      tenantId: 'tenant-2',
    })
  })
  it('requests fresh proof when the scoped reset token expires', async () => {
    vi.mocked(passwordRecoveryService.resetPassword).mockRejectedValue(
      axiosErrorWithCode('INVALID_RESET_TOKEN'),
    )
    const user = userEvent.setup()
    render(
      <AuthQueryTestProvider>
        <PasswordRecoveryScreen />
      </AuthQueryTestProvider>,
    )
    await completeCodeStep(user)
    await user.type(screen.getByLabelText('Nova senha'), 'new-password')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'new-password')
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))
    await user.click(await screen.findByRole('button', { name: 'Reenviar código' }))
    await screen.findByRole('heading', { name: 'Verifique seu e-mail' })
    expect(passwordRecoveryService.requestCode).toHaveBeenCalledTimes(2)
    expect(screen.getAllByLabelText(/Código de verificação/)[0]).toHaveValue('')
  })
})
