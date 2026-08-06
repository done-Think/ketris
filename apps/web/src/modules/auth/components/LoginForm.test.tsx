import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginForm } from './LoginForm'

const loginMock = vi.hoisted(() => vi.fn())

vi.mock('../hooks/use-login', () => ({
  useLogin: () => ({
    error: null,
    login: loginMock,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    loginMock.mockReset()
    loginMock.mockResolvedValue(false)
  })

  it('exibe mensagens de validação quando o formulário está vazio', async () => {
    const user = userEvent.setup()
    render(<LoginForm callbackUrl="/dashboard" />)

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument()
    expect(await screen.findByText('Informe sua senha')).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('exibe a opção visual do Google desabilitada até a integração com o backend', () => {
    render(<LoginForm callbackUrl="/dashboard" />)

    expect(screen.getByRole('button', { name: 'Continuar com Google (em breve)' })).toBeDisabled()
  })

  it('direciona a criação de conta para a rota de cadastro', () => {
    render(<LoginForm callbackUrl="/dashboard" />)

    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
  })

  it('envia credenciais normalizadas pelo schema', async () => {
    const user = userEvent.setup()
    render(<LoginForm callbackUrl="/dashboard" />)

    await user.type(screen.getByLabelText('E-mail'), 'ADMIN@KETRIS.DEV')
    await user.type(screen.getByLabelText('Senha'), 'senha-existente')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(loginMock.mock.calls[0]?.[0]).toEqual({
      email: 'admin@ketris.dev',
      password: 'senha-existente',
    })
  })
})
