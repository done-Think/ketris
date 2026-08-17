import { describe, expect, it } from 'vitest'

import { searchPropertiesQuerySchema } from './search-properties.schema'

describe('searchPropertiesQuerySchema', () => {
  it('aceita um objeto vazio (sem filtros)', () => {
    const result = searchPropertiesQuerySchema.safeParse({})

    expect(result.success).toBe(true)
  })

  it('coage strings de query string para número', () => {
    const result = searchPropertiesQuerySchema.parse({
      precoMin: '1000',
      precoMax: '3000',
      quartosMin: '2',
    })

    expect(result.precoMin).toBe(1000)
    expect(result.precoMax).toBe(3000)
    expect(result.quartosMin).toBe(2)
  })

  it('rejeita finalidade fora do enum', () => {
    const result = searchPropertiesQuerySchema.safeParse({ finalidade: 'TEMPORADA' })

    expect(result.success).toBe(false)
  })

  it('rejeita preço negativo', () => {
    const result = searchPropertiesQuerySchema.safeParse({ precoMin: '-1' })

    expect(result.success).toBe(false)
  })
})
