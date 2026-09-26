import { describe, expect, it } from 'vitest'

import { registerRequestSchema } from './register.schema'

const base = {
  fullName: 'Ana Agente',
  email: 'ana@ketris.dev',
  password: 'senha-longa-123',
}

describe('registerRequestSchema', () => {
  it('aceita proprietario/imobiliaria/construtora com companyName opcional', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'proprietario' }).success).toBe(true)
    expect(
      registerRequestSchema.safeParse({
        ...base,
        profile: 'imobiliaria',
        companyName: 'Imobiliária X',
      }).success,
    ).toBe(true)
  })

  it('aceita corretor autônomo (sem agencyId) e corretor entrando numa imobiliária (com agencyId)', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'corretor' }).success).toBe(true)
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'corretor', agencyId: 'agency-1' })
        .success,
    ).toBe(true)
  })

  it('aceita locatario', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'locatario' }).success).toBe(true)
  })

  it('rejeita um profile desconhecido', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'inexistente' }).success).toBe(false)
  })

  it('rejeita senha curta', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'locatario', password: '123' }).success,
    ).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'locatario', email: 'nao-e-email' })
        .success,
    ).toBe(false)
  })
})
