import { describe, expect, it } from 'vitest'

import { createUserRequestSchema } from './create-user.schema'

describe('createUserRequestSchema', () => {
  it('aceita payload completo válido com role OWNER', () => {
    const result = createUserRequestSchema.safeParse({
      name: 'Ana Proprietária',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      role: 'OWNER',
    })

    expect(result.success).toBe(true)
  })

  it('aceita payload completo válido com role AGENT', () => {
    const result = createUserRequestSchema.safeParse({
      name: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      role: 'AGENT',
    })

    expect(result.success).toBe(true)
  })

  it('aplica role padrão AGENT quando omitido', () => {
    const result = createUserRequestSchema.safeParse({
      name: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe('AGENT')
    }
  })

  it('rejeita role ADMIN — este endpoint nunca cria administradores', () => {
    const result = createUserRequestSchema.safeParse({
      name: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      role: 'ADMIN',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = createUserRequestSchema.safeParse({
      name: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: '123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['password'])
    }
  })

  it('rejeita nome vazio', () => {
    const result = createUserRequestSchema.safeParse({
      name: '',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const result = createUserRequestSchema.safeParse({
      name: 'Ana Agente',
      email: 'nao-e-email',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita role fora do enum', () => {
    const result = createUserRequestSchema.safeParse({
      name: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      role: 'SUPERADMIN',
    })

    expect(result.success).toBe(false)
  })
})
