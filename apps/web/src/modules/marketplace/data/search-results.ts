import { type MarketplacePropertyDetail, getPropertyDetailById } from './property-details'

export type SearchResultPurpose = 'alugar' | 'comprar'

export type SearchResultProperty = MarketplacePropertyDetail & {
  purpose: SearchResultPurpose
}

const searchResultIdsByPurpose = {
  alugar: [
    'apartamento-jardins',
    'apartamento-garden-remodelado',
    'loft-industrial-mobiliado',
    'cobertura-itaim-bibi',
    'apartamento-moema',
    'casa-alto-da-boa-vista',
  ],
  comprar: [
    'apartamento-jardins-venda',
    'apartamento-jardim-paulista-venda',
    'cobertura-pinheiros-venda',
    'casa-alto-da-lapa-venda',
    'loft-vila-madalena-venda',
  ],
} as const satisfies Record<SearchResultPurpose, readonly string[]>

export const searchResults: SearchResultProperty[] = Object.entries(
  searchResultIdsByPurpose,
).flatMap(([purpose, propertyIds]) =>
  propertyIds.flatMap((propertyId) => {
    const property = getPropertyDetailById(propertyId)

    return property ? [{ ...property, purpose: purpose as SearchResultPurpose }] : []
  }),
)
