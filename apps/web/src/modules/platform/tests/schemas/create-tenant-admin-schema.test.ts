import { describe, expect, it } from 'vitest'

import { createTenantAdminSchema } from '../../schemas/create-tenant-admin-schema'

const schema = createTenantAdminSchema((key) => key)

describe('createTenantAdminSchema', () => {
  it('aceita payload válido com senhas coincidentes', () => {
    const result = schema.safeParse({
      name: 'Admin da Imobiliária',
      email: 'admin@imobiliaria.dev',
      password: 'senha-longa-123',
      confirmPassword: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando as senhas não coincidem', () => {
    const result = schema.safeParse({
      name: 'Admin da Imobiliária',
      email: 'admin@imobiliaria.dev',
      password: 'senha-longa-123',
      confirmPassword: 'outra-senha',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword'])
    }
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createTenantAdminSchema((key) => `translated:${key}`)
    const result = translated.safeParse({
      name: 'Admin da Imobiliária',
      email: 'admin@imobiliaria.dev',
      password: '123',
      confirmPassword: '123',
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:passwordTooShort',
    )
  })
})
