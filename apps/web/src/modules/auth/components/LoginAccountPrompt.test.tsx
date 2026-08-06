import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LoginAccountPrompt } from './LoginAccountPrompt'

describe('LoginAccountPrompt', () => {
  it('direciona a criação de conta para a rota de cadastro', () => {
    render(<LoginAccountPrompt />)

    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro')
  })
})
