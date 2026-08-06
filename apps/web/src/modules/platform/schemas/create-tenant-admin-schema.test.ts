import { describe, expect, it } from 'vitest'

import { createTenantAdminSchema } from './create-tenant-admin-schema'

describe('createTenantAdminSchema', () => {
  it('aceita payload válido com senhas coincidentes', () => {
    const result = createTenantAdminSchema.safeParse({
      nome: 'Admin da Imobiliária',
      email: 'admin@imobiliaria.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando as senhas não coincidem', () => {
    const result = createTenantAdminSchema.safeParse({
      nome: 'Admin da Imobiliária',
      email: 'admin@imobiliaria.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'outra-senha',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmarSenha'])
    }
  })
})
