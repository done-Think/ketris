import { describe, expect, it } from 'vitest'

import { loginSchema } from './login-schema'

describe('loginSchema', () => {
  it('normaliza o e-mail e aceita credenciais preenchidas', () => {
    const result = loginSchema.parse({
      email: '  ADMIN@KETRIS.DEV ',
      password: 'senha-existente',
    })

    expect(result).toEqual({
      email: 'admin@ketris.dev',
      password: 'senha-existente',
    })
  })

  it('rejeita e-mail inválido e senha vazia', () => {
    const result = loginSchema.safeParse({ email: 'invalido', password: '' })

    expect(result.success).toBe(false)
  })
})
