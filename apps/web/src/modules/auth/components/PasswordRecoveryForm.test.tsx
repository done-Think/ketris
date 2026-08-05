import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PasswordRecoveryForm } from './PasswordRecoveryForm'

describe('PasswordRecoveryForm', () => {
  it('exibe a composição principal da recuperação de senha', () => {
    render(<PasswordRecoveryForm />)

    expect(screen.getByRole('heading', { name: 'Recuperar senha' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('placeholder', 'seu@email.com')
    expect(screen.getByRole('button', { name: 'Enviar instruções' })).toBeInTheDocument()
  })

  it('valida o e-mail antes de processar a solicitação', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryForm />)

    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }))

    expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('informa que a integração ainda não está disponível após validar o formulário', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryForm />)

    await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'O envio das instruções será habilitado quando o serviço de recuperação estiver disponível.',
    )
  })
})
