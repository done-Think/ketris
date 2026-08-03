import { describe, expect, it } from 'vitest'

import { loginRequestSchema } from './login.schema'

describe('loginRequestSchema', () => {
  it('aceita e-mail e senha válidos', () => {
    const result = loginRequestSchema.safeParse({ email: 'ana@ketris.dev', password: 'segredo123' })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail com formato inválido', () => {
    const result = loginRequestSchema.safeParse({ email: 'nao-e-email', password: 'segredo123' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['email'])
    }
  })

  it('rejeita senha vazia', () => {
    const result = loginRequestSchema.safeParse({ email: 'ana@ketris.dev', password: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['password'])
    }
  })

  it('rejeita payload sem os campos obrigatórios', () => {
    const result = loginRequestSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('ignora campos extras desconhecidos (schema não usa .strict())', () => {
    const result = loginRequestSchema.safeParse({
      email: 'ana@ketris.dev',
      password: 'segredo123',
      campoExtra: 'qualquer',
    })

    expect(result.success).toBe(true)
  })
})
