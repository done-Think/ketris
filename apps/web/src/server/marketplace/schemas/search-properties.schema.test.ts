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
    const result = searchPropertiesQuerySchema.safeParse({ purpose: 'TEMPORADA' })

    expect(result.success).toBe(false)
  })

  it('rejeita sortBy fora do enum', () => {
    const result = searchPropertiesQuerySchema.safeParse({ sortBy: 'aleatorio' })

    expect(result.success).toBe(false)
  })

  it('rejeita preço negativo', () => {
    const result = searchPropertiesQuerySchema.safeParse({ minPrice: '-1' })

    expect(result.success).toBe(false)
  })
})
