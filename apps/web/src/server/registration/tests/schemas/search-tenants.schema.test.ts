import { describe, expect, it } from 'vitest'

import { searchTenantsQuerySchema } from '../../schemas/search-tenants.schema'

describe('searchTenantsQuerySchema', () => {
  it('aceita um termo de busca não vazio', () => {
    expect(searchTenantsQuerySchema.safeParse({ q: 'imobiliária' }).success).toBe(true)
  })

  it('aceita um termo vazio ou ausente para listar as primeiras imobiliárias', () => {
    expect(searchTenantsQuerySchema.parse({ q: '' }).q).toBe('')
    expect(searchTenantsQuerySchema.parse({}).q).toBe('')
  })

  it('rejeita um termo de busca grande demais', () => {
    expect(searchTenantsQuerySchema.safeParse({ q: 'a'.repeat(101) }).success).toBe(false)
  })
})
