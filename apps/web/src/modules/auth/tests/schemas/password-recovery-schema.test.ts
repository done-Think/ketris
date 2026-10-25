import { describe, expect, it } from 'vitest'

import {
  createPasswordRecoverySchema,
  createPasswordResetSchema,
} from '../../schemas/password-recovery-schema'

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
  it('validates the approved 72-byte limit on new passwords, including multibyte characters', () => {
    const reset = createPasswordResetSchema((key) => key)
    expect(
      reset.safeParse({
        code: '123456',
        password: 'a'.repeat(72),
        passwordConfirmation: 'a'.repeat(72),
      }).success,
    ).toBe(true)
    const excessive = reset.safeParse({
      code: '123456',
      password: 'á'.repeat(37),
      passwordConfirmation: 'á'.repeat(37),
    })
    expect(excessive.success).toBe(false)
    expect(excessive.success ? undefined : excessive.error.issues[0].message).toBe(
      'passwordTooLong',
    )
  })

  it('accepts 72 UTF-8 bytes of emojis and rejects larger new passwords', () => {
    const reset = createPasswordResetSchema((key) => key)
    const atLimit = '😀'.repeat(18)
    expect(
      reset.safeParse({ code: '123456', password: atLimit, passwordConfirmation: atLimit }).success,
    ).toBe(true)
    const excessive = '😀'.repeat(19)
    expect(
      reset.safeParse({ code: '123456', password: excessive, passwordConfirmation: excessive })
        .success,
    ).toBe(false)
  })

  it('rejects email addresses above the approved 254-character limit', () => {
    expect(schema.safeParse({ email: `${'a'.repeat(245)}@example.com` }).success).toBe(false)
  })
})
