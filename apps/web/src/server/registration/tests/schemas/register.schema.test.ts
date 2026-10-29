import { describe, expect, it } from 'vitest'

import { registerRequestSchema } from '../../schemas/register.schema'

const base = {
  fullName: 'Ana Agente',
  phone: '(11) 99999-9999',
  acceptTerms: true,
  email: 'ana@ketris.dev',
  password: 'senha-longa-123',
}

describe('registerRequestSchema', () => {
  it('aceita proprietario/imobiliaria/construtora com companyName opcional', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'owner' }).success).toBe(true)
    expect(
      registerRequestSchema.safeParse({
        ...base,
        profile: 'agency',
        companyName: 'Imobiliária X',
      }).success,
    ).toBe(true)
  })

  it('aceita corretor autônomo (sem agencyId) e corretor entrando numa imobiliária (com agencyId)', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'broker', creci: '12345-F' }).success,
    ).toBe(true)
    expect(
      registerRequestSchema.safeParse({
        ...base,
        profile: 'broker',
        creci: '12345-F',
        agencyId: 'agency-1',
      }).success,
    ).toBe(true)
  })

  it('aceita locatario', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'renter' }).success).toBe(true)
  })

  it('rejeita um profile desconhecido', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'inexistente' }).success).toBe(false)
  })

  it('rejeita senha curta', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'renter', password: '123' }).success,
    ).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'renter', email: 'nao-e-email' }).success,
    ).toBe(false)
  })
})

it('rejeita ausência de aceite e impede truncamento de senha em bytes UTF-8', () => {
  expect(
    registerRequestSchema.safeParse({ ...base, profile: 'renter', acceptTerms: false }).success,
  ).toBe(false)
  expect(
    registerRequestSchema.safeParse({ ...base, profile: 'renter', password: 'é'.repeat(36) })
      .success,
  ).toBe(true)
  expect(
    registerRequestSchema.safeParse({ ...base, profile: 'renter', password: 'é'.repeat(37) })
      .success,
  ).toBe(false)
})
