import { describe, expect, it } from 'vitest'

import { platformSignInSchema } from './platform-sign-in-schema'

describe('platformSignInSchema', () => {
  it('aceita e-mail e senha válidos', () => {
    const result = platformSignInSchema.safeParse({
      email: 'alysson@ketris.dev',
      password: 'segredo123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = platformSignInSchema.safeParse({ email: 'nao-e-email', password: 'segredo123' })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail ou senha vazios', () => {
    expect(platformSignInSchema.safeParse({ email: '', password: 'x' }).success).toBe(false)
    expect(
      platformSignInSchema.safeParse({ email: 'alysson@ketris.dev', password: '' }).success,
    ).toBe(false)
  })
})
