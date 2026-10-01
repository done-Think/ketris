import { describe, expect, it } from 'vitest'

import { createTenantSchema } from '../../schemas/create-tenant-schema'

const schema = createTenantSchema((key) => key)

describe('createTenantSchema', () => {
  it('aceita payload válido', () => {
    const result = schema.safeParse({
      nome: 'Imobiliária Exemplo',
      slug: 'imobiliaria-exemplo',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita slug com maiúsculas ou espaços', () => {
    const result = schema.safeParse({ nome: 'Imobiliária Exemplo', slug: 'Imobiliaria Exemplo' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe('slugInvalid')
  })

  it('rejeita nome ou slug vazios', () => {
    expect(schema.safeParse({ nome: '', slug: 'imobiliaria-exemplo' }).success).toBe(false)
    expect(schema.safeParse({ nome: 'Imobiliária Exemplo', slug: '' }).success).toBe(false)
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createTenantSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ nome: '', slug: 'imobiliaria-exemplo' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:nameRequired',
    )
  })
})
