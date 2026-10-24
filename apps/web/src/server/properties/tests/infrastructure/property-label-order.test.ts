import { describe, expect, it } from 'vitest'

import { getPropertyLabelOrder } from '../../infrastructure/property-label-order'

describe('property label ordering', () => {
  it.each([
    ['pt-BR', ['APARTAMENTO', 'CASA', 'COBERTURA', 'COMERCIAL', 'LOFT', 'OUTRO', 'STUDIO']],
    ['en-US', ['APARTAMENTO', 'COMERCIAL', 'CASA', 'LOFT', 'OUTRO', 'COBERTURA', 'STUDIO']],
    ['es-ES', ['APARTAMENTO', 'COBERTURA', 'CASA', 'COMERCIAL', 'LOFT', 'OUTRO', 'STUDIO']],
  ] as const)('orders property types by their %s labels', (locale, expected) => {
    expect(getPropertyLabelOrder({ sortBy: 'type', locale })).toEqual(expected)
  })

  it.each([
    ['pt-BR', ['ALUGADO', 'PUBLICADO', 'RASCUNHO', 'INATIVO', 'VENDIDO']],
    ['en-US', ['PUBLICADO', 'INATIVO', 'ALUGADO', 'VENDIDO', 'RASCUNHO']],
    ['es-ES', ['ALUGADO', 'PUBLICADO', 'RASCUNHO', 'INATIVO', 'VENDIDO']],
  ] as const)('orders statuses by their %s labels', (locale, expected) => {
    expect(getPropertyLabelOrder({ sortBy: 'status', locale })).toEqual(expected)
  })
})
