import { describe, expect, it } from 'vitest'

import { createAdminRequestSchema } from './create-admin.schema'

describe('createAdminRequestSchema', () => {
  it('aceita payload válido e nunca expõe campo papel (sempre ADMIN implícito)', () => {
    const result = createAdminRequestSchema.safeParse({
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('papel')
    }
  })

  it('ignora um campo papel enviado no corpo (schema não o declara)', () => {
    const result = createAdminRequestSchema.safeParse({
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
      papel: 'AGENT',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('papel')
    }
  })

  it('rejeita senha curta', () => {
    const result = createAdminRequestSchema.safeParse({
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: '123',
    })

    expect(result.success).toBe(false)
  })
})
