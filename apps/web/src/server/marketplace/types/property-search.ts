import type { PropertyPurpose, PublicPropertyType, PublishedPropertySummary } from './property'

export type PropertySort = 'recent' | 'priceAsc' | 'priceDesc'

export interface PropertySearchFilters {
  latitude?: number
  longitude?: number
  purpose?: PropertyPurpose
  propertyType?: PublicPropertyType
  city?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  minArea?: number
  hasParking?: boolean
  sortBy?: PropertySort
  q?: string
}

export interface PropertySearchPage {
  page: number
  pageSize: number
}

export interface PropertySearchResult {
  items: PublishedPropertySummary[]
  totalCount: number
}
