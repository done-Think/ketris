import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PasswordRecoveryScreen } from '../../components/PasswordRecoveryScreen'

async function goToCodeStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
  await user.click(screen.getByRole('button', { name: 'Enviar código' }))
  await screen.findByRole('heading', { name: 'Verifique seu e-mail' })
}

describe('PasswordRecoveryScreen', () => {
  it('exibe a composição principal da recuperação de senha', () => {
    render(<PasswordRecoveryScreen />)

    expect(screen.getByRole('heading', { name: 'Recuperar senha' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('placeholder', 'seu@email.com')
    expect(screen.getByRole('button', { name: 'Enviar código' })).toBeInTheDocument()
  })

  it('valida o e-mail antes de avançar', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryScreen />)

    await user.click(screen.getByRole('button', { name: 'Enviar código' }))

    expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Verifique seu e-mail' })).not.toBeInTheDocument()
  })

  it('avança pro passo do código após enviar o e-mail', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryScreen />)

    await goToCodeStep(user)

    expect(screen.getByLabelText(/Código de verificação/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar em 1:00' })).toBeDisabled()
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
  })

  it('revela os campos de nova senha só depois do código completo, e redefine a senha', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryScreen />)

    await goToCodeStep(user)

    const submitButton = screen.getByRole('button', { name: 'Redefinir senha' })
    expect(submitButton).toBeDisabled()
    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/Código de verificação/), '123456')

    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument()
    expect(submitButton).toBeEnabled()

    await user.type(screen.getByLabelText('Nova senha'), 'senha-longa-123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'senha-longa-123')
    await user.click(submitButton)

    expect(await screen.findByRole('heading', { name: 'Senha redefinida!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login')
  })

  it('rejeita senhas diferentes', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryScreen />)

    await goToCodeStep(user)
    await user.type(screen.getByLabelText(/Código de verificação/), '123456')
    await user.type(screen.getByLabelText('Nova senha'), 'senha-longa-123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'outra-senha')
    await user.click(screen.getByRole('button', { name: 'Redefinir senha' }))

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Senha redefinida!' })).not.toBeInTheDocument()
  })
})
