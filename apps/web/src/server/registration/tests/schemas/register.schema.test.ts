import { describe, expect, it } from 'vitest'

import { registerRequestSchema } from '../../schemas/register.schema'

const base = {
  fullName: 'Ana Agente',
  phone: '(11) 99999-9999',
  acceptTerms: true,
  email: 'ana@ketris.dev',
  password: 'senha-longa-123',
}
const cpf = '529.982.247-25'
const cnpj = '11.222.333/0001-81'

describe('registerRequestSchema', () => {
  it('aceita proprietario/imobiliaria/construtora com companyName opcional', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'owner', cpf }).success).toBe(true)
    expect(
      registerRequestSchema.safeParse({
        ...base,
        profile: 'agency',
        cnpj,
        companyName: 'Imobiliária X',
      }).success,
    ).toBe(true)
  })

  it('aceita corretor autônomo (sem agencyId) e corretor entrando numa imobiliária (com agencyId)', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'broker', creci: '12345-F', cpf })
        .success,
    ).toBe(true)
    expect(
      registerRequestSchema.safeParse({
        ...base,
        profile: 'broker',
        creci: '12345-F',
        cpf,
        agencyId: 'agency-1',
      }).success,
    ).toBe(true)
  })

  it('aceita locatario', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'renter', cpf }).success).toBe(true)
  })

  it.each(['agency', 'developer', 'condoManager'] as const)(
    'accepts an optional CRECI for %s',
    (profile) => {
      expect(
        registerRequestSchema.parse({ ...base, profile, cnpj, creci: ' MG-12345-J ' }),
      ).toMatchObject({ creci: 'MG-12345-J' })
      expect(
        registerRequestSchema.safeParse({ ...base, profile, cnpj, creci: 'x'.repeat(33) }).success,
      ).toBe(false)
    },
  )

  it('exige CPF para pessoas e CNPJ para empresas, validados e só com dígitos', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'renter' }).success).toBe(false)
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'renter', cpf: '111.111.111-11' })
        .success,
    ).toBe(false)
    expect(registerRequestSchema.parse({ ...base, profile: 'renter', cpf })).toMatchObject({
      cpf: '52998224725',
    })
    expect(registerRequestSchema.safeParse({ ...base, profile: 'agency' }).success).toBe(false)
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'agency', cnpj: '11.222.333/0001-82' })
        .success,
    ).toBe(false)
    expect(registerRequestSchema.parse({ ...base, profile: 'developer', cnpj })).toMatchObject({
      cnpj: '11222333000181',
    })
  })

  it('não aceita CNPJ para pessoas nem CPF para empresas', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'owner', cpf, cnpj }).success).toBe(
      false,
    )
    expect(registerRequestSchema.safeParse({ ...base, profile: 'agency', cnpj, cpf }).success).toBe(
      false,
    )
  })

  it('rejeita um profile desconhecido', () => {
    expect(registerRequestSchema.safeParse({ ...base, profile: 'inexistente' }).success).toBe(false)
  })

  it('rejeita senha curta', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'renter', cpf, password: '123' }).success,
    ).toBe(false)
  })

  it('rejeita e-mail inválido', () => {
    expect(
      registerRequestSchema.safeParse({ ...base, profile: 'renter', cpf, email: 'nao-e-email' })
        .success,
    ).toBe(false)
  })
})

it('rejeita ausência de aceite e impede truncamento de senha em bytes UTF-8', () => {
  expect(
    registerRequestSchema.safeParse({ ...base, profile: 'renter', cpf, acceptTerms: false })
      .success,
  ).toBe(false)
  expect(
    registerRequestSchema.safeParse({ ...base, profile: 'renter', cpf, password: 'é'.repeat(36) })
      .success,
  ).toBe(true)
  expect(
    registerRequestSchema.safeParse({ ...base, profile: 'renter', cpf, password: 'é'.repeat(37) })
      .success,
  ).toBe(false)
})
