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
  latitude: number | null
  longitude: number | null
  brokerName: string | null
  brokerAvatarUrl: string | null
  coverUrl: string | null
  publishedAt: string | null
}

export interface ListPropertiesResponse {
  properties: PublicPropertySummary[]
}

export interface PublicPropertyAddress {
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
}

export interface PublicPropertyMedia {
  id: string
  url: string
  type: string
  order: number
}

export interface PublicPropertyDetail extends PublicPropertySummary {
  description: string | null
  address: PublicPropertyAddress | null
  media: PublicPropertyMedia[]
}

export interface PropertyDetailResponse {
  property: PublicPropertyDetail
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
