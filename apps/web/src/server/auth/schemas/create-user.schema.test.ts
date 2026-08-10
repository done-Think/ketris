import { describe, expect, it } from 'vitest'

import { createUserRequestSchema } from './create-user.schema'

describe('createUserRequestSchema', () => {
  it('aceita payload completo válido com papel OWNER', () => {
    const result = createUserRequestSchema.safeParse({
      nome: 'Ana Proprietária',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      papel: 'OWNER',
    })

    expect(result.success).toBe(true)
  })

  it('aceita payload completo válido com papel AGENT', () => {
    const result = createUserRequestSchema.safeParse({
      nome: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      papel: 'AGENT',
    })

    expect(result.success).toBe(true)
  })

  it('aplica papel padrão AGENT quando omitido', () => {
    const result = createUserRequestSchema.safeParse({
      nome: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.papel).toBe('AGENT')
    }
  })

  it('rejeita papel ADMIN — este endpoint nunca cria administradores', () => {
    const result = createUserRequestSchema.safeParse({
      nome: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      papel: 'ADMIN',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = createUserRequestSchema.safeParse({
      nome: 'Ana Agente',
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
      nome: '',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    const result = createUserRequestSchema.safeParse({
      nome: 'Ana Agente',
      email: 'nao-e-email',
      password: 'senha-longa-123',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita papel fora do enum', () => {
    const result = createUserRequestSchema.safeParse({
      nome: 'Ana Agente',
      email: 'ana@ketris.dev',
      password: 'senha-longa-123',
      papel: 'SUPERADMIN',
    })

    expect(result.success).toBe(false)
  })
})
