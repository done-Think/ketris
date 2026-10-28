import { describe, expect, it } from 'vitest'

import { getPropertyLabelOrder } from '../../infrastructure/property-label-order'

describe('property label ordering', () => {
  it.each([
    ['pt-BR', ['APARTMENT', 'HOUSE', 'PENTHOUSE', 'COMMERCIAL', 'LOFT', 'OTHER', 'STUDIO']],
    ['en-US', ['APARTMENT', 'COMMERCIAL', 'HOUSE', 'LOFT', 'OTHER', 'PENTHOUSE', 'STUDIO']],
    ['es-ES', ['APARTMENT', 'PENTHOUSE', 'HOUSE', 'COMMERCIAL', 'LOFT', 'OTHER', 'STUDIO']],
  ] as const)('orders property types by their %s labels', (locale, expected) => {
    expect(getPropertyLabelOrder({ sortBy: 'type', locale })).toEqual(expected)
  })

  it.each([
    ['pt-BR', ['RENTED', 'PUBLISHED', 'DRAFT', 'INACTIVE', 'SOLD']],
    ['en-US', ['PUBLISHED', 'INACTIVE', 'RENTED', 'SOLD', 'DRAFT']],
    ['es-ES', ['RENTED', 'PUBLISHED', 'DRAFT', 'INACTIVE', 'SOLD']],
  ] as const)('orders statuses by their %s labels', (locale, expected) => {
    expect(getPropertyLabelOrder({ sortBy: 'status', locale })).toEqual(expected)
  })
})
