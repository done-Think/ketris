import { describe, expect, it } from 'vitest'

import { loginPlatformRequestSchema } from './login-platform.schema'

describe('loginPlatformRequestSchema', () => {
  it('aceita payload válido', () => {
    const result = loginPlatformRequestSchema.safeParse({
      email: 'alysson@ketris.dev',
      password: 'qualquer-coisa',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = loginPlatformRequestSchema.safeParse({
      email: 'nao-e-email',
      password: 'qualquer-coisa',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita senha vazia', () => {
    const result = loginPlatformRequestSchema.safeParse({
      email: 'alysson@ketris.dev',
      password: '',
    })

    expect(result.success).toBe(false)
  })
})
