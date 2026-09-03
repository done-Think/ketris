export type PropertyPurpose = 'ALUGUEL' | 'VENDA'

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
  type: string
  order: number
}

export interface PublishedPropertySummary {
  id: string
  title: string
  purpose: PropertyPurpose
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
  publishedAt: Date | null
}

export interface PublishedPropertyDetail extends PublishedPropertySummary {
  tenantId: string
  description: string | null
  address: PropertyAddress | null
  media: PropertyMedia[]
}

export type PublicPropertyDetail = Omit<PublishedPropertyDetail, 'tenantId'>

export function toPublicPropertyDetail(property: PublishedPropertyDetail): PublicPropertyDetail {
  return {
    id: property.id,
    title: property.title,
    purpose: property.purpose,
    propertyType: property.propertyType,
    price: property.price,
    condoFee: property.condoFee,
    propertyTax: property.propertyTax,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parkingSpots: property.parkingSpots,
    area: property.area,
    city: property.city,
    neighborhood: property.neighborhood,
    coverUrl: property.coverUrl,
    publishedAt: property.publishedAt,
    description: property.description,
    address: property.address,
    media: property.media,
  }
}
