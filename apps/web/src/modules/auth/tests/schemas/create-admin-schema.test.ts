import { describe, expect, it } from 'vitest'

import { createAdminSchema } from '../../schemas/create-admin-schema'

const schema = createAdminSchema((key) => key)

describe('createAdminSchema', () => {
  it('aceita payload válido com senhas coincidentes', () => {
    const result = schema.safeParse({
      name: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
      confirmPassword: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando as senhas não coincidem', () => {
    const result = schema.safeParse({
      name: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
      confirmPassword: 'outra-senha',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
      expect(result.error.issues[0]?.message).toBe('passwordMismatch')
    }
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = schema.safeParse({
      name: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: '123',
      confirmPassword: '123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita nome ou e-mail vazios', () => {
    expect(
      schema.safeParse({
        name: '',
        email: 'admin2@ketris.dev',
        password: 'senha-longa-123',
        confirmPassword: 'senha-longa-123',
      }).success,
    ).toBe(false)

    expect(
      schema.safeParse({
        name: 'Novo Admin',
        email: 'nao-e-email',
        password: 'senha-longa-123',
        confirmPassword: 'senha-longa-123',
      }).success,
    ).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createAdminSchema((key) => `translated:${key}`)
    const result = translated.safeParse({
      name: '',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
      confirmPassword: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:nameRequired',
    )
  })
})
