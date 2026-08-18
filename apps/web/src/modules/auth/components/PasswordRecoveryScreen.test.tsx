import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PasswordRecoveryScreen } from './PasswordRecoveryScreen'

describe('PasswordRecoveryScreen', () => {
  it('exibe a composição principal da recuperação de senha', () => {
    render(<PasswordRecoveryScreen />)

    expect(screen.getByRole('heading', { name: 'Recuperar senha' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('placeholder', 'seu@email.com')
    expect(screen.getByRole('button', { name: 'Enviar instruções' })).toBeInTheDocument()
  })

  it('valida o e-mail antes de processar a solicitação', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryScreen />)

    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }))

    expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'E-mail enviado!' })).not.toBeInTheDocument()
  })

  it('troca para a confirmação na mesma rota após enviar', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryScreen />)

    await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }))

    expect(await screen.findByRole('heading', { name: 'E-mail enviado!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login')
  })

  it('mantém o reenvio bloqueado enquanto o contador não zera', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryScreen />)

    await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }))

    expect(await screen.findByRole('button', { name: 'Reenviar em 1:00' })).toBeDisabled()
  })
})
