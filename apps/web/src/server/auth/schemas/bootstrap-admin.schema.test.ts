import { describe, expect, it } from 'vitest'

import { bootstrapAdminRequestSchema } from './bootstrap-admin.schema'

describe('bootstrapAdminRequestSchema', () => {
  it('aceita payload válido com tenantSlug e nunca expõe campo papel (sempre ADMIN implícito)', () => {
    const result = bootstrapAdminRequestSchema.safeParse({
      tenantSlug: 'ketris-demo',
      nome: 'Primeiro Admin',
      email: 'admin@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('papel')
    }
  })

  it('rejeita quando tenantSlug está vazio', () => {
    const result = bootstrapAdminRequestSchema.safeParse({
      tenantSlug: '',
      nome: 'Primeiro Admin',
      email: 'admin@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita senha curta', () => {
    const result = bootstrapAdminRequestSchema.safeParse({
      tenantSlug: 'ketris-demo',
      nome: 'Primeiro Admin',
      email: 'admin@ketris.dev',
      password: '123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const result = bootstrapAdminRequestSchema.safeParse({
      tenantSlug: 'ketris-demo',
      nome: 'Primeiro Admin',
      email: 'nao-e-email',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })
})
