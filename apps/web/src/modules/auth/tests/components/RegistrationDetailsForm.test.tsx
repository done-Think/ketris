import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RegistrationDetailsForm } from '../../components/RegistrationDetailsForm'

describe('RegistrationDetailsForm', () => {
  it('exibe os campos da segunda etapa e a regra de CRECI do corretor', () => {
    render(<RegistrationDetailsForm profile="corretor" />)

    expect(screen.getByLabelText(/Nome completo/)).toBeInTheDocument()
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Telefone/)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Senha/)).toHaveAttribute('type', 'password')
    expect(screen.getByText('Campo obrigatório para corretores')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('botão de criar conta fica desabilitado até os termos serem aceitos', async () => {
    const user = userEvent.setup()
    render(<RegistrationDetailsForm profile="corretor" />)

    const submitButton = screen.getByRole('button', { name: 'Criar conta' })
    expect(submitButton).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
    expect(submitButton).toBeEnabled()

    await user.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
    expect(submitButton).toBeDisabled()
  })

  it('valida os campos obrigatórios antes de continuar', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(<RegistrationDetailsForm profile="corretor" onSubmit={submit} />)

    await user.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Informe seu nome completo')).toBeInTheDocument()
    expect(screen.getByText('Informe seu e-mail')).toBeInTheDocument()
    expect(screen.getByText('Informe seu telefone')).toBeInTheDocument()
    expect(screen.getByText('Informe seu CRECI')).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  it('alterna a visibilidade de senha e confirmar senha de forma independente', async () => {
    const user = userEvent.setup()
    render(<RegistrationDetailsForm profile="corretor" />)

    const passwordInput = screen.getByLabelText(/^Senha/)
    const confirmationInput = screen.getByPlaceholderText('Confirme a senha')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmationInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar Senha' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(confirmationInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar Confirmar senha' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(confirmationInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Ocultar Senha' }))
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmationInput).toHaveAttribute('type', 'text')
  })

  it('envia dados válidos e normalizados para um proprietário', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(<RegistrationDetailsForm profile="proprietario" onSubmit={submit} />)

    await user.type(screen.getByLabelText(/Nome completo/), 'Maria da Silva')
    await user.type(screen.getByLabelText(/E-mail/), 'MARIA@EMAIL.COM')
    await user.type(screen.getByLabelText(/Telefone/), '11999999999')
    await user.type(screen.getByLabelText(/^Senha/), 'senha-segura')
    await user.type(screen.getByPlaceholderText('Confirme a senha'), 'senha-segura')
    await user.click(screen.getByRole('checkbox', { name: /Li e aceito/ }))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(submit).toHaveBeenCalledWith({
      profile: 'proprietario',
      fullName: 'Maria da Silva',
      email: 'maria@email.com',
      phone: '(11) 99999-9999',
      password: 'senha-segura',
      passwordConfirmation: 'senha-segura',
      creci: '',
      acceptTerms: true,
    })
  }, 20000)
})
