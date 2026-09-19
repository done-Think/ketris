import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmailVerificationStep } from '../../components/EmailVerificationStep'

describe('EmailVerificationStep', () => {
  it('mostra o e-mail cadastrado e mantém o botão de confirmar desabilitado até o código completo', async () => {
    const user = userEvent.setup()
    const onConfirmed = vi.fn()
    render(<EmailVerificationStep email="ana@ketris.dev" onConfirmed={onConfirmed} />)

    expect(screen.getByText(/ana@ketris\.dev/)).toBeInTheDocument()
    const submitButton = screen.getByRole('button', { name: 'Confirmar' })
    expect(submitButton).toBeDisabled()

    const codeBoxes = screen.getAllByLabelText(/Código de verificação/)
    await user.click(codeBoxes[0])
    await user.type(codeBoxes[0], '123456')
    expect(submitButton).toBeEnabled()

    await user.click(submitButton)
    expect(onConfirmed).toHaveBeenCalledOnce()
  })

  it('permite pular a confirmação e seguir depois', async () => {
    const user = userEvent.setup()
    const onConfirmed = vi.fn()
    render(<EmailVerificationStep email="ana@ketris.dev" onConfirmed={onConfirmed} />)

    await user.click(screen.getByRole('button', { name: 'Confirmar depois' }))

    expect(onConfirmed).toHaveBeenCalledOnce()
  })
})
