import type { MarketplacePropertyType, SearchablePropertyType } from '../types/public-property'

export const marketplacePropertyTypes = [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'PENTHOUSE',
  'COMMERCIAL',
  'LOFT',
] as const satisfies readonly SearchablePropertyType[]

export const propertyTypeLabelKeys = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  STUDIO: 'studio',
  PENTHOUSE: 'penthouse',
  COMMERCIAL: 'commercial',
  LOFT: 'loft',
  OTHER: 'other',
} as const satisfies Record<MarketplacePropertyType, string>

export function isMarketplacePropertyType(value: unknown): value is SearchablePropertyType {
  return marketplacePropertyTypes.some((type) => type === value)
}

export function isPropertyTypeCode(value: unknown): value is MarketplacePropertyType {
  return typeof value === 'string' && Object.hasOwn(propertyTypeLabelKeys, value)
}
