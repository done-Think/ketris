import { marketplacePropertyTypes } from './property-types'

export const searchOptions = {
  location: {
    labelKey: 'location',
    query: 'location',
    values: [
      'Jardins, São Paulo',
      'Vila Madalena, São Paulo',
      'Itaim Bibi, São Paulo',
      'Moema, São Paulo',
      'Pinheiros, São Paulo',
      'Savassi, Belo Horizonte',
      'Batista Campos, Belém',
    ],
  },
  propertyType: {
    labelKey: 'propertyType',
    query: 'propertyType',
    values: marketplacePropertyTypes,
  },
  priceRange: {
    labelKey: 'priceRange',
    query: 'priceRange',
    values: [],
  },
} as const

export const searchFilterOrder = ['location', 'propertyType', 'priceRange'] as const
export const textSearchFilterOrder = ['location', 'propertyType'] as const

export const priceLimit = {
  min: 0,
  max: 10000,
  step: 500,
}
