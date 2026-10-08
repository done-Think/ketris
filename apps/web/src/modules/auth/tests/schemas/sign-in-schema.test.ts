import { describe, expect, it } from 'vitest'

import { createSignInSchema } from '../../schemas/sign-in-schema'

const schema = createSignInSchema((key) => key)

describe('signInSchema', () => {
  it('aceita e-mail e senha válidos', () => {
    const result = schema.safeParse({ email: 'admin@ketris.dev', password: 'segredo123' })

    expect(result.success).toBe(true)
  })

  it('rejeita e-mail inválido', () => {
    const result = schema.safeParse({ email: 'nao-e-email', password: 'segredo123' })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail ou senha vazios', () => {
    expect(schema.safeParse({ email: '', password: 'x' }).success).toBe(false)
    expect(schema.safeParse({ email: 'admin@ketris.dev', password: '' }).success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createSignInSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ email: '', password: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:emailRequired',
    )
  })
})
