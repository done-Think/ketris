import { describe, expect, it } from 'vitest'

import { searchPropertiesQuerySchema } from './search-properties.schema'

describe('searchPropertiesQuerySchema', () => {
  it('aceita um objeto vazio (sem filtros)', () => {
    const result = searchPropertiesQuerySchema.safeParse({})

    expect(result.success).toBe(true)
  })

  it('coage strings de query string para número', () => {
    const result = searchPropertiesQuerySchema.parse({
      minPrice: '1000',
      maxPrice: '3000',
      minBedrooms: '2',
      minArea: '80',
    })

    expect(result.minPrice).toBe(1000)
    expect(result.maxPrice).toBe(3000)
    expect(result.minBedrooms).toBe(2)
    expect(result.minArea).toBe(80)
  })

  it('coage hasParking de string para boolean', () => {
    const result = searchPropertiesQuerySchema.parse({ hasParking: 'true' })

    expect(result.hasParking).toBe(true)
  })

  it('rejeita purpose fora do enum', () => {
    const result = searchPropertiesQuerySchema.safeParse({ purpose: 'SEASONAL' })

    expect(result.success).toBe(false)
  })

  it('rejeita sortBy fora do enum', () => {
    const result = searchPropertiesQuerySchema.safeParse({ sortBy: 'aleatorio' })

    expect(result.success).toBe(false)
  })

  it('pagina por padrão em 12 itens e limita a página a 50', () => {
    expect(searchPropertiesQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 12 })
    expect(searchPropertiesQuerySchema.parse({ page: '2', pageSize: '50' })).toMatchObject({
      page: 2,
      pageSize: 50,
    })
    expect(searchPropertiesQuerySchema.safeParse({ pageSize: '51' }).success).toBe(false)
    expect(searchPropertiesQuerySchema.safeParse({ page: '0' }).success).toBe(false)
  })

  it('rejeita preço negativo', () => {
    const result = searchPropertiesQuerySchema.safeParse({ minPrice: '-1' })

    expect(result.success).toBe(false)
  })
})
