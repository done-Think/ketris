import { describe, expect, it } from 'vitest'

import { createAdminSchema } from './create-admin-schema'

describe('createAdminSchema', () => {
  it('aceita payload válido com senhas coincidentes', () => {
    const result = createAdminSchema.safeParse({
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita quando as senhas não coincidem', () => {
    const result = createAdminSchema.safeParse({
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: 'senha-longa-123',
      confirmarSenha: 'outra-senha',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmarSenha'])
    }
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = createAdminSchema.safeParse({
      nome: 'Novo Admin',
      email: 'admin2@ketris.dev',
      password: '123',
      confirmarSenha: '123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita nome ou e-mail vazios', () => {
    expect(
      createAdminSchema.safeParse({
        nome: '',
        email: 'admin2@ketris.dev',
        password: 'senha-longa-123',
        confirmarSenha: 'senha-longa-123',
      }).success,
    ).toBe(false)

    expect(
      createAdminSchema.safeParse({
        nome: 'Novo Admin',
        email: 'nao-e-email',
        password: 'senha-longa-123',
        confirmarSenha: 'senha-longa-123',
      }).success,
    ).toBe(false)
  })
})
