import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PasswordRecoveryConfirmation } from './PasswordRecoveryConfirmation'

describe('PasswordRecoveryConfirmation', () => {
  it('exibe a confirmação e o caminho de volta ao login', () => {
    render(<PasswordRecoveryConfirmation />)

    expect(screen.getByRole('heading', { name: 'E-mail enviado!' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Enviamos as instruções para o seu e-mail.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login')
  })
})
