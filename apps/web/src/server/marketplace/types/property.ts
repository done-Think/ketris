export type PropertyPurpose = 'RENT' | 'SALE' | 'BOTH'

export type PublicPropertyType =
  'APARTMENT' | 'HOUSE' | 'STUDIO' | 'PENTHOUSE' | 'COMMERCIAL' | 'LOFT' | 'OTHER'

export interface PropertyAddress {
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

export interface PropertyMedia {
  id: string
  url: string
  type: 'photo' | 'video' | 'floorPlan'
  order: number
}

export interface PublishedPropertySummary {
  id: string
  title: string
  purpose: PropertyPurpose
  propertyType: PublicPropertyType
  price: number
  rentalPrice?: number | null
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
  publishedAt: Date | null
}

export interface PublishedPropertyDetail extends PublishedPropertySummary {
  tenantId: string
  description: string | null
  address: PropertyAddress | null
  media: PropertyMedia[]
}

export type PublicPropertyDetail = Omit<PublishedPropertyDetail, 'tenantId'>
