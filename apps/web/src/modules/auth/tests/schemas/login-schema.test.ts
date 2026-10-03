import { describe, expect, it } from 'vitest'

import { createLoginSchema } from '../../schemas/login-schema'

const schema = createLoginSchema((key) => key)

describe('loginSchema', () => {
  it('normaliza o e-mail e aceita credenciais preenchidas', () => {
    const result = schema.parse({
      email: '  ADMIN@KETRIS.DEV ',
      password: 'senha-existente',
    })

    expect(result).toEqual({
      email: 'admin@ketris.dev',
      password: 'senha-existente',
    })
  })

  it('rejeita e-mail inválido e senha vazia', () => {
    const result = schema.safeParse({ email: 'invalido', password: '' })

    expect(result.success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createLoginSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ email: '', password: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:emailRequired',
    )
  })
})
