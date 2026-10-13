import { describe, expect, it } from 'vitest'

import { createTenantRequestSchema } from './create-tenant.schema'

describe('createTenantRequestSchema', () => {
  it('aceita payload válido', () => {
    const result = createTenantRequestSchema.safeParse({
      name: 'Imobiliária Exemplo',
      slug: 'imobiliaria-exemplo',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita slug com maiúsculas', () => {
    expect(
      createTenantRequestSchema.safeParse({ name: 'X', slug: 'Imobiliaria-Exemplo' }).success,
    ).toBe(false)
  })

  it('rejeita slug com espaço', () => {
    expect(
      createTenantRequestSchema.safeParse({ name: 'X', slug: 'imobiliaria exemplo' }).success,
    ).toBe(false)
  })

  it('rejeita slug com underscore', () => {
    expect(
      createTenantRequestSchema.safeParse({ name: 'X', slug: 'imobiliaria_exemplo' }).success,
    ).toBe(false)
  })

  it('rejeita nome vazio', () => {
    expect(createTenantRequestSchema.safeParse({ name: '', slug: 'valido' }).success).toBe(false)
  })
})
