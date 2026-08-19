import { describe, expect, it } from 'vitest'

import { passwordRecoverySchema } from './password-recovery-schema'

describe('passwordRecoverySchema', () => {
  it('normaliza um e-mail válido', () => {
    const result = passwordRecoverySchema.parse({ email: '  USUARIO@EMAIL.COM ' })

    expect(result).toEqual({ email: 'usuario@email.com' })
  })

  it('rejeita um e-mail inválido', () => {
    const result = passwordRecoverySchema.safeParse({ email: 'invalido' })

    expect(result.success).toBe(false)
  })
})
