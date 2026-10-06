import type {
  PropertyPurpose,
  PublishedPropertyDetail,
  PublishedPropertySummary,
} from '../../types/property'

export type PropertySort = 'recent' | 'priceAsc' | 'priceDesc'

export interface PropertySearchFilters {
  purpose?: PropertyPurpose
  propertyType?: string
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

export interface PublicPropertyRepository {
  search(filters: PropertySearchFilters): Promise<PublishedPropertySummary[]>
  findPublishedById(id: string): Promise<PublishedPropertyDetail | null>
}
