import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PasswordRecoveryForm } from './PasswordRecoveryForm'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('PasswordRecoveryForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

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
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('abre a confirmação após validar o formulário', async () => {
    const user = userEvent.setup()
    render(<PasswordRecoveryForm />)

    await user.type(screen.getByLabelText('E-mail'), 'usuario@email.com')
    await user.click(screen.getByRole('button', { name: 'Enviar instruções' }))

    expect(pushMock).toHaveBeenCalledWith('/recuperar-senha/email-enviado')
  })
})
