import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PasswordRecoveryConfirmation } from '../../components/PasswordRecoveryConfirmation'

describe('PasswordRecoveryConfirmation', () => {
  it('exibe a confirmação de senha redefinida e o caminho de volta ao login', () => {
    render(<PasswordRecoveryConfirmation />)

    expect(screen.getByRole('heading', { name: 'Senha redefinida!' })).toBeInTheDocument()
    expect(
      screen.getByText('Sua senha foi alterada com sucesso. Você já pode entrar com a nova senha.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login')
  })
})
