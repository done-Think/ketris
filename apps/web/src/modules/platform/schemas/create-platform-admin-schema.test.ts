import { describe, expect, it } from 'vitest'

import { createPlatformAdminSchema } from './create-platform-admin-schema'

describe('createPlatformAdminSchema', () => {
  it('aceita payload válido com senhas coincidentes', () => {
    const result = createPlatformAdminSchema.safeParse({
      nome: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando as senhas não coincidem', () => {
    const result = createPlatformAdminSchema.safeParse({
      nome: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'outra-senha',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmarSenha'])
    }
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = createPlatformAdminSchema.safeParse({
      nome: 'Sócio Ketris',
      email: 'socio@ketris.dev',
      password: '123',
      confirmarSenha: '123',
    })

    expect(result.success).toBe(false)
  })
})
