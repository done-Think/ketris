import type { PropertyPurpose, PublicPropertyType } from './property'

export type DecimalLike = { toNumber(): number }

export type PropertyAddressRow = {
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude: DecimalLike | null
  longitude: DecimalLike | null
}

export type PropertyMediaRow = { id: string; url: string; type: string; position: number }

export type PropertySummaryRow = {
  id: string
  title: string
  purpose: PropertyPurpose
  type: PublicPropertyType
  price: DecimalLike
  condoFee: DecimalLike | null
  propertyTax: DecimalLike | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpots: number | null
  areaSqm: DecimalLike | null
  publishedAt: Date | null
  address: {
    city: string
    neighborhood: string
    latitude: DecimalLike | null
    longitude: DecimalLike | null
  } | null
  responsible: { name: string; avatarUrl: string | null } | null
  media: { url: string }[]
}

export type PropertyDetailRow = PropertySummaryRow & {
  tenantId: string
  description: string | null
  address: PropertyAddressRow | null
  media: PropertyMediaRow[]
}
