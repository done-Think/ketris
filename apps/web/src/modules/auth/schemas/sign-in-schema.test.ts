import { describe, expect, it } from 'vitest'

import { signInSchema } from './sign-in-schema'

describe('signInSchema', () => {
  it('aceita e-mail e senha válidos', () => {
    const result = signInSchema.safeParse({ email: 'admin@ketris.dev', password: 'segredo123' })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = signInSchema.safeParse({ email: 'nao-e-email', password: 'segredo123' })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail ou senha vazios', () => {
    expect(signInSchema.safeParse({ email: '', password: 'x' }).success).toBe(false)
    expect(signInSchema.safeParse({ email: 'admin@ketris.dev', password: '' }).success).toBe(false)
  })
})
