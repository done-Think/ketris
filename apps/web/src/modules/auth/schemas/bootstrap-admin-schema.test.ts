import { describe, expect, it } from 'vitest'

import { bootstrapAdminSchema } from './bootstrap-admin-schema'

describe('bootstrapAdminSchema', () => {
  it('aceita payload válido com senhas coincidentes', () => {
    const result = bootstrapAdminSchema.safeParse({
      tenantSlug: 'ketris-demo',
      nome: 'Primeiro Admin',
      email: 'admin@ketris.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando as senhas não coincidem', () => {
    const result = bootstrapAdminSchema.safeParse({
      tenantSlug: 'ketris-demo',
      nome: 'Primeiro Admin',
      email: 'admin@ketris.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'outra-senha',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmarSenha'])
    }
  })

  it('rejeita tenantSlug vazio', () => {
    const result = bootstrapAdminSchema.safeParse({
      tenantSlug: '',
      nome: 'Primeiro Admin',
      email: 'admin@ketris.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = bootstrapAdminSchema.safeParse({
      tenantSlug: 'ketris-demo',
      nome: 'Primeiro Admin',
      email: 'admin@ketris.dev',
      password: '123',
      confirmarSenha: '123',
    })

    expect(result.success).toBe(false)
  })
})
