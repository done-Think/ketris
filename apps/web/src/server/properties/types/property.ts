import type { AppLocale } from '@/i18n/types/locale.types'
export type PropertyType =
  'APARTMENT' | 'HOUSE' | 'STUDIO' | 'PENTHOUSE' | 'COMMERCIAL' | 'LOFT' | 'OTHER'

export type PropertyAmenity = 'FURNISHED' | 'GOURMET_BALCONY' | 'PET_FRIENDLY' | 'CONCIERGE_24H'

export interface PropertyListing {
  amenities: PropertyAmenity[]
  negotiationTerms: string | null
  publishAfterReview: boolean
  allowWhatsappContact: boolean
  featured: boolean
}

export type PropertyPurpose = 'RENT' | 'SALE' | 'BOTH'

export type PropertyStatus = 'DRAFT' | 'PUBLISHED' | 'RENTED' | 'SOLD' | 'INACTIVE'

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
  position: number
  createdAt: Date
}

export interface PropertyMediaInput {
  url: string
  type?: string
  position?: number
}

export interface PropertyValues {
  price: number
  rentalPrice: number | null
  condoFee: number | null
  propertyTax: number | null
}

export interface PropertyCharacteristics {
  bedrooms: number | null
  bathrooms: number | null
  parkingSpots: number | null
  areaSqm: number | null
}

export interface Property {
  responsibleName: string
  activeContractId: string | null
  id: string
  tenantId: string
  responsibleId: string
  ownerId: string | null
  ownerContactId?: string | null
  ownerContact?: { id: string; name: string } | null
  title: string
  description: string | null
  purpose: PropertyPurpose
  type: PropertyType
  listing: PropertyListing
  status: PropertyStatus
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  address: PropertyAddress | null
  media: PropertyMedia[]
  values: PropertyValues
  characteristics: PropertyCharacteristics
}

export interface NewProperty {
  tenantId: string
  responsibleId: string
  ownerId?: string | null
  ownerContactId?: string | null
  title: string
  description?: string | null
  purpose: PropertyPurpose
  type: PropertyType
  listing?: PropertyListing
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpots?: number | null
  areaSqm?: number | null
  price: number
  rentalPrice?: number | null
  condoFee?: number | null
  propertyTax?: number | null
  address?: PropertyAddress
  media?: PropertyMediaInput[]
}

export interface PropertyChanges {
  ownerId?: string | null
  ownerContactId?: string | null
  title?: string
  description?: string | null
  purpose?: PropertyPurpose
  type?: PropertyType
  listing?: PropertyListing
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpots?: number | null
  areaSqm?: number | null
  price?: number
  rentalPrice?: number | null
  condoFee?: number | null
  propertyTax?: number | null
  address?: PropertyAddress
  media?: PropertyMediaInput[]
}

export type PropertySortField =
  'title' | 'type' | 'saleValue' | 'rentalValue' | 'status' | 'broker' | 'updatedAt'

export interface PropertyListFilters {
  locale?: AppLocale
  sortBy?: PropertySortField
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  search?: string
  tenantId: string
  renterId?: string
  ownerId?: string
  status?: PropertyStatus
  purpose?: PropertyPurpose
  responsibleId?: string
}

export interface RentedProperty {
  propertyId: string
  tenantId: string
}

export interface ActiveContractProperty {
  contractId: string
  propertyId: string
  contractStatus:
    'DRAFT' | 'IN_REVIEW' | 'AWAITING_SIGNATURE' | 'SIGNED' | 'ACTIVE' | 'CLOSED' | 'CANCELED'
  purpose: PropertyPurpose
}

export interface PropertyOwnerOption {
  id: string
  name: string
}

export interface PropertyPage {
  properties: Property[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  counts: Record<PropertyStatus, number>
}

export interface PropertyOwnersPage {
  owners: PropertyOwnerOption[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export type PropertyAccessTarget = Pick<Property, 'responsibleId' | 'ownerId'>
