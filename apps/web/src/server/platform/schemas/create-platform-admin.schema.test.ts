import { describe, expect, it } from 'vitest'

import { createPlatformAdminRequestSchema } from './create-platform-admin.schema'

describe('createPlatformAdminRequestSchema', () => {
  it('aceita payload válido', () => {
    const result = createPlatformAdminRequestSchema.safeParse({
      nome: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      password: 'senha-longa-123',
      role: 'ADMIN',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita senha curta', () => {
    const result = createPlatformAdminRequestSchema.safeParse({
      nome: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      password: '123',
      role: 'AGENT',
    })

    expect(result.success).toBe(false)
  })
})
