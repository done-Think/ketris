export type PublicPropertyPurpose = 'ALUGUEL' | 'VENDA' | 'AMBOS'

export type MarketplacePropertyType =
  'APARTAMENTO' | 'CASA' | 'STUDIO' | 'COBERTURA' | 'COMERCIAL' | 'LOFT' | 'OUTRO'

export type SearchablePropertyType = Exclude<MarketplacePropertyType, 'OUTRO'>

export interface PublicPropertySummary {
  id: string
  title: string
  purpose: PublicPropertyPurpose
  propertyType: MarketplacePropertyType
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
  totalCount: number
  page: number
  pageSize: number
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
  propertyType?: MarketplacePropertyType
  location?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  minArea?: number
  hasParking?: boolean
  sortBy?: PropertySortOption
  page?: number
  pageSize?: number
}

export interface SubmitInquiryPayload {
  leadName: string
  leadEmail: string
  leadPhone?: string
  proposedValue?: number
  notes?: string
}

export interface SubmitInquiryResult {
  id: string
  propertyId: string
  status: 'ENVIADA'
  createdAt: string
}

export interface SubmitInquiryResponse {
  inquiry: SubmitInquiryResult
}

export interface MarketplaceStats {
  publishedProperties: number
  publishedBrokers: number
  servedCities: number
}
