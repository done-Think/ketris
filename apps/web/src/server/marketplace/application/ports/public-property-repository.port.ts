import type {
  PropertyPurpose,
  PublishedPropertyDetail,
  PublishedPropertySummary,
} from '../../domain/property.entity'

export type PropertySort = 'recent' | 'priceAsc' | 'priceDesc'

export interface PropertySearchFilters {
  purpose?: PropertyPurpose
  propertyType?: string
  city?: string
  /** Free-text match across neighborhood and city, unlike `city`'s exact match. */
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
