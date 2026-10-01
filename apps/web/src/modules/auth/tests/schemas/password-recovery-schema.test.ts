import { describe, expect, it } from 'vitest'

import { createPasswordRecoverySchema } from '../../schemas/password-recovery-schema'

const schema = createPasswordRecoverySchema((key) => key)

describe('passwordRecoverySchema', () => {
  it('normaliza um e-mail válido', () => {
    const result = schema.parse({ email: '  USUARIO@EMAIL.COM ' })

    expect(result).toEqual({ email: 'usuario@email.com' })
  })

  it('rejeita um e-mail inválido', () => {
    const result = schema.safeParse({ email: 'invalido' })

    expect(result.success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createPasswordRecoverySchema((key) => `translated:${key}`)
    const result = translated.safeParse({ email: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:emailRequired',
    )
  })
})
