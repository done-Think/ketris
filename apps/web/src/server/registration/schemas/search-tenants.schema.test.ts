import { describe, expect, it } from 'vitest'

import { searchTenantsQuerySchema } from './search-tenants.schema'

describe('searchTenantsQuerySchema', () => {
  it('aceita um termo de busca não vazio', () => {
    expect(searchTenantsQuerySchema.safeParse({ q: 'imobiliária' }).success).toBe(true)
  })

  it('rejeita um termo de busca vazio', () => {
    expect(searchTenantsQuerySchema.safeParse({ q: '' }).success).toBe(false)
  })

  it('rejeita quando o parâmetro q está ausente', () => {
    expect(searchTenantsQuerySchema.safeParse({}).success).toBe(false)
  })
})
