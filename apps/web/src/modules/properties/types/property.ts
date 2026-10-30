import type { components } from '@shared/types/generated/api'

export type PropertyType =
  'apartment' | 'house' | 'studio' | 'penthouse' | 'commercial' | 'loft' | 'other'

export type ApiPropertyType = components['schemas']['TenantProperty']['type']

export type PropertyAmenity = 'furnished' | 'gourmetBalcony' | 'petFriendly' | 'concierge24h'

export type ApiPropertyAmenity = components['schemas']['TenantPropertyListing']['amenities'][number]

export interface PropertyListing {
  amenities: PropertyAmenity[]
  negotiationTerms: string | null
  publishAfterReview: boolean
  allowWhatsappContact: boolean
  featured: boolean
}

export type ApiPropertyListing = components['schemas']['TenantPropertyListing']

export type PropertyPurpose = components['schemas']['TenantProperty']['purpose']

export type PropertyStatus = components['schemas']['TenantProperty']['status']

export type PropertyAddress = NonNullable<components['schemas']['TenantPropertyAddress']>

export type PropertyMediaType = components['schemas']['TenantPropertyMedia']['type']

export type PropertyMedia = Omit<ApiPropertyMedia, 'position'> & { order: number }

export type PropertyMediaInput = Omit<
  components['schemas']['TenantPropertyMediaInput'],
  'position'
> & { order?: number }

export type PropertyValues = components['schemas']['TenantPropertyValues']

export type PropertyCharacteristics = components['schemas']['TenantPropertyCharacteristics']

export interface Property {
  id: string
  tenantId: string
  responsibleUserId: string
  responsibleName: string
  activeContractId: string | null
  ownerUserId: string | null
  ownerContactId?: string | null
  ownerContact?: NonNullable<components['schemas']['TenantProperty']['ownerContact']> | null
  title: string
  description: string | null
  purpose: PropertyPurpose
  type: PropertyType
  status: PropertyStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  address: PropertyAddress | null
  media: PropertyMedia[]
  values: PropertyValues
  characteristics: PropertyCharacteristics
  listing: PropertyListing
}

export interface PropertyFormValues {
  ownerUserId?: string | null
  ownerContactId?: string | null
  listing?: PropertyListing
  title: string
  description?: string | null
  purpose: PropertyPurpose
  type: PropertyType
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

export type PropertySortField = NonNullable<
  components['schemas']['ListTenantPropertiesQuery']['sortBy']
>

export type PropertyListFilters = components['schemas']['ListTenantPropertiesQuery']

export type ApiPropertyAddress = NonNullable<components['schemas']['TenantPropertyAddress']>

export type ApiPropertyMedia = components['schemas']['TenantPropertyMedia']

export type ApiProperty = components['schemas']['TenantProperty']

export type PropertyOwnerOption = components['schemas']['PropertyOwnersResponse']['owners'][number]
export type PropertyOwnersResponse = components['schemas']['PropertyOwnersResponse']
export interface PropertyPayloadOptions {
  existingAddress?: PropertyAddress | null
  canChooseOwner?: boolean
}

export type PropertyPage = Omit<components['schemas']['TenantPropertiesResponse'], 'properties'> & {
  properties: Property[]
}
