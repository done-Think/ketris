export type PublicPropertyPurpose = 'ALUGUEL' | 'VENDA'

export interface PublicPropertySummary {
  id: string
  title: string
  purpose: PublicPropertyPurpose
  propertyType: string
  price: number
  condoFee: number | null
  propertyTax: number | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpots: number | null
  area: number | null
  city: string | null
  neighborhood: string | null
  coverUrl: string | null
  publishedAt: string | null
}

export type PropertySortOption = 'recent' | 'priceAsc' | 'priceDesc'

export interface SearchPropertiesFilters {
  purpose?: PublicPropertyPurpose
  propertyType?: string
  location?: string
  maxPrice?: number
  minBedrooms?: number
  minArea?: number
  hasParking?: boolean
  sortBy?: PropertySortOption
}
