import { describe, expect, it } from 'vitest'

import { createTenantSchema } from './create-tenant-schema'

describe('createTenantSchema', () => {
  it('aceita payload válido', () => {
    const result = createTenantSchema.safeParse({
      nome: 'Imobiliária Exemplo',
      slug: 'imobiliaria-exemplo',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita slug com maiúsculas ou espaços', () => {
    expect(
      createTenantSchema.safeParse({ nome: 'Imobiliária Exemplo', slug: 'Imobiliaria Exemplo' })
        .success,
    ).toBe(false)
  })

  it('rejeita nome ou slug vazios', () => {
    expect(createTenantSchema.safeParse({ nome: '', slug: 'imobiliaria-exemplo' }).success).toBe(
      false,
    )
    expect(createTenantSchema.safeParse({ nome: 'Imobiliária Exemplo', slug: '' }).success).toBe(
      false,
    )
  })
})
