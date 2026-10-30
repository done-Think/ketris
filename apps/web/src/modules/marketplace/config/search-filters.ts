import { marketplacePropertyTypes } from './property-types'

export const searchOptions = {
  location: {
    labelKey: 'location',
    query: 'location',
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
