import { describe, expect, it } from 'vitest'

import { createTenantSchema } from '../../schemas/create-tenant-schema'

const schema = createTenantSchema((key) => key)
const defaults = { accountType: 'AGENCY', startAsTrial: false }

describe('createTenantSchema', () => {
  it('aceita payload válido', () => {
    const result = schema.safeParse({
      name: 'Imobiliária Exemplo',
      slug: 'imobiliaria-exemplo',
      ...defaults,
    })

    expect(result.success).toBe(true)
  })

  it('aceita os três tipos de conta e rejeita outros', () => {
    for (const accountType of ['INDIVIDUAL', 'BROKER', 'AGENCY']) {
      expect(
        schema.safeParse({ name: 'Conta', slug: 'conta', accountType, startAsTrial: true }).success,
      ).toBe(true)
    }
    expect(
      schema.safeParse({ name: 'Conta', slug: 'conta', accountType: 'GOLD', startAsTrial: false })
        .success,
    ).toBe(false)
  })

  it('rejeita slug com maiúsculas ou espaços', () => {
    const result = schema.safeParse({
      name: 'Imobiliária Exemplo',
      slug: 'Imobiliaria Exemplo',
      ...defaults,
    })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe('slugInvalid')
  })

  it('rejeita nome ou slug vazios', () => {
    expect(schema.safeParse({ name: '', slug: 'imobiliaria-exemplo', ...defaults }).success).toBe(
      false,
    )
    expect(schema.safeParse({ name: 'Imobiliária Exemplo', slug: '', ...defaults }).success).toBe(
      false,
    )
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createTenantSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ name: '', slug: 'imobiliaria-exemplo', ...defaults })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:nameRequired',
    )
  })
})
