import { describe, expect, it } from 'vitest'

import { bootstrapPlatformAdminRequestSchema } from './bootstrap-platform-admin.schema'

describe('bootstrapPlatformAdminRequestSchema', () => {
  it('aceita payload válido', () => {
    const result = bootstrapPlatformAdminRequestSchema.safeParse({
      nome: 'Alysson Sene',
      email: 'alysson@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita senha curta', () => {
    const result = bootstrapPlatformAdminRequestSchema.safeParse({
      nome: 'Alysson Sene',
      email: 'alysson@ketris.dev',
      password: '123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const result = bootstrapPlatformAdminRequestSchema.safeParse({
      nome: 'Alysson Sene',
      email: 'nao-e-email',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })
})
