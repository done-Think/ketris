import type { MarketplacePropertyType, SearchablePropertyType } from '../types/public-property'

export const marketplacePropertyTypes = [
  'APARTAMENTO',
  'CASA',
  'STUDIO',
  'COBERTURA',
  'COMERCIAL',
  'LOFT',
] as const satisfies readonly SearchablePropertyType[]

export const propertyTypeLabelKeys = {
  APARTAMENTO: 'apartment',
  CASA: 'house',
  STUDIO: 'studio',
  COBERTURA: 'penthouse',
  COMERCIAL: 'commercial',
  LOFT: 'loft',
  OUTRO: 'other',
} as const satisfies Record<MarketplacePropertyType, string>

export function isMarketplacePropertyType(value: unknown): value is SearchablePropertyType {
  return marketplacePropertyTypes.some((type) => type === value)
}

export function isPropertyTypeCode(value: unknown): value is MarketplacePropertyType {
  return typeof value === 'string' && Object.hasOwn(propertyTypeLabelKeys, value)
}
