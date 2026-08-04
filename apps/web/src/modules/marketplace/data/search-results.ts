import { type MarketplacePropertyDetail, getPropertyDetailById } from './property-details'

const searchResultIds = [
  'apartamento-jardins',
  'cobertura-itaim-bibi',
  'apartamento-garden-remodelado',
  'loft-industrial-mobiliado',
] as const

export const searchResults: MarketplacePropertyDetail[] = searchResultIds.flatMap((propertyId) => {
  const property = getPropertyDetailById(propertyId)

  return property ? [property] : []
})
