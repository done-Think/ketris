import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RegistrationDetailsForm } from './RegistrationDetailsForm'

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

  it('valida os campos obrigatórios antes de continuar', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(<RegistrationDetailsForm profile="corretor" onSubmit={submit} />)

    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Informe seu nome completo')).toBeInTheDocument()
    expect(screen.getByText('Informe seu e-mail')).toBeInTheDocument()
    expect(screen.getByText('Informe seu telefone')).toBeInTheDocument()
    expect(screen.getByText('Informe seu CRECI')).toBeInTheDocument()
    expect(screen.getByText('Aceite os termos para continuar')).toBeInTheDocument()
    expect(submit).not.toHaveBeenCalled()
  })

  it('envia dados válidos e normalizados para um proprietário', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(<RegistrationDetailsForm profile="proprietario" onSubmit={submit} />)

    await user.type(screen.getByLabelText(/Nome completo/), 'Maria da Silva')
    await user.type(screen.getByLabelText(/E-mail/), 'MARIA@EMAIL.COM')
    await user.type(screen.getByLabelText(/Telefone/), '(11) 99999-9999')
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
  })
})
