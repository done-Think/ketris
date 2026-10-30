import type { components } from '@shared/types/generated/api'
import { normalizePostalCode } from '@shared/utils/postal-code'
import type {
  ApiProperty,
  ApiPropertyType,
  ApiPropertyAmenity,
  PropertyType,
  PropertyAmenity,
  ApiPropertyAddress,
  ApiPropertyMedia,
  Property,
  PropertyAddress,
  PropertyFormValues,
  PropertyListing,
  PropertyMediaInput,
  PropertyPurpose,
} from '../types/property'

const propertyTypeToApi: Record<PropertyType, ApiPropertyType> = {
  apartment: 'APARTMENT',
  house: 'HOUSE',
  studio: 'STUDIO',
  penthouse: 'PENTHOUSE',
  commercial: 'COMMERCIAL',
  loft: 'LOFT',
  other: 'OTHER',
}

const propertyTypeFromApi: Record<ApiPropertyType, PropertyType> = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  STUDIO: 'studio',
  PENTHOUSE: 'penthouse',
  COMMERCIAL: 'commercial',
  LOFT: 'loft',
  OTHER: 'other',
}

const amenityToApi: Record<PropertyAmenity, ApiPropertyAmenity> = {
  furnished: 'FURNISHED',
  gourmetBalcony: 'GOURMET_BALCONY',
  petFriendly: 'PET_FRIENDLY',
  concierge24h: 'CONCIERGE_24H',
}

const amenityFromApi: Record<ApiPropertyAmenity, PropertyAmenity> = {
  FURNISHED: 'furnished',
  GOURMET_BALCONY: 'gourmetBalcony',
  PET_FRIENDLY: 'petFriendly',
  CONCIERGE_24H: 'concierge24h',
}

function toApiListing(listing: PropertyListing) {
  return {
    amenities: listing.amenities.map((amenity) => amenityToApi[amenity]),
    negotiationTerms: listing.negotiationTerms,
    publishAfterReview: listing.publishAfterReview,
    allowWhatsappContact: listing.allowWhatsappContact,
    featured: listing.featured,
  }
}

export function toApiPurpose(purpose: PropertyPurpose): 'RENT' | 'SALE' | 'BOTH' {
  if (purpose === 'BOTH') return 'BOTH'

  return purpose === 'RENT' ? 'RENT' : 'SALE'
}

function fromApiPurpose(purpose: 'RENT' | 'SALE' | 'BOTH'): PropertyPurpose {
  if (purpose === 'BOTH') return 'BOTH'

  return purpose === 'RENT' ? 'RENT' : 'SALE'
}

function toApiAddress(address: PropertyAddress) {
  return {
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    zipCode: normalizePostalCode(address.zipCode) ?? address.zipCode,
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

function fromApiAddress(address: ApiPropertyAddress | null): PropertyAddress | null {
  if (!address) return null

  return {
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

function toApiMedia(media: PropertyMediaInput[] | undefined) {
  if (!media) return undefined

  return media.map((item) => ({ url: item.url, type: item.type, position: item.order }))
}

function fromApiMedia(media: ApiPropertyMedia[]): Property['media'] {
  return media.map((item) => ({
    id: item.id,
    url: item.url,
    type: item.type,
    order: item.position,
    createdAt: item.createdAt,
  }))
}

export function mapProperty(api: ApiProperty): Property {
  return {
    id: api.id,
    tenantId: api.tenantId,
    responsibleUserId: api.responsibleId,
    responsibleName: api.responsibleName,
    activeContractId: api.activeContractId,
    ownerUserId: api.ownerId,
    ownerContactId: api.ownerContactId ?? null,
    ownerContact: api.ownerContact ?? null,
    title: api.title,
    description: api.description,
    purpose: fromApiPurpose(api.purpose),
    type: propertyTypeFromApi[api.type],
    listing: {
      amenities: api.listing.amenities.map((amenity) => amenityFromApi[amenity]),
      negotiationTerms: api.listing.negotiationTerms,
      publishAfterReview: api.listing.publishAfterReview,
      allowWhatsappContact: api.listing.allowWhatsappContact,
      featured: api.listing.featured,
    },
    status: api.status,
    publishedAt: api.publishedAt,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    address: fromApiAddress(api.address),
    media: fromApiMedia(api.media),
    values: {
      price: api.values.price,
      rentalPrice: api.values.rentalPrice,
      condoFee: api.values.condoFee,
      propertyTax: api.values.propertyTax,
    },
    characteristics: {
      bedrooms: api.characteristics.bedrooms,
      bathrooms: api.characteristics.bathrooms,
      parkingSpots: api.characteristics.parkingSpots,
      areaSqm: api.characteristics.areaSqm,
    },
  }
}

export function toCreatePayload(
  values: PropertyFormValues,
): components['schemas']['CreateTenantPropertyRequest'] {
  return {
    ownerId: values.ownerUserId,
    ownerContactId: values.ownerContactId,
    title: values.title,
    description: values.description ?? null,
    purpose: toApiPurpose(values.purpose),
    type: propertyTypeToApi[values.type],
    listing: values.listing ? toApiListing(values.listing) : undefined,
    bedrooms: values.bedrooms ?? null,
    bathrooms: values.bathrooms ?? null,
    parkingSpots: values.parkingSpots ?? null,
    areaSqm: values.areaSqm ?? null,
    price: values.price,
    rentalPrice: values.rentalPrice ?? null,
    condoFee: values.condoFee ?? null,
    propertyTax: values.propertyTax ?? null,
    address: values.address ? toApiAddress(values.address) : undefined,
    media: toApiMedia(values.media),
  }
}

export function toUpdatePayload(
  payload: Partial<PropertyFormValues>,
): components['schemas']['UpdateTenantPropertyRequest'] {
  const body: components['schemas']['UpdateTenantPropertyRequest'] = {}

  if (payload.ownerUserId !== undefined) body.ownerId = payload.ownerUserId
  if (payload.ownerContactId !== undefined) body.ownerContactId = payload.ownerContactId
  if (payload.listing !== undefined) body.listing = toApiListing(payload.listing)
  if (payload.title !== undefined) body.title = payload.title
  if (payload.description !== undefined) body.description = payload.description
  if (payload.purpose !== undefined) body.purpose = toApiPurpose(payload.purpose)
  if (payload.type !== undefined) body.type = propertyTypeToApi[payload.type]
  if (payload.bedrooms !== undefined) body.bedrooms = payload.bedrooms
  if (payload.bathrooms !== undefined) body.bathrooms = payload.bathrooms
  if (payload.parkingSpots !== undefined) body.parkingSpots = payload.parkingSpots
  if (payload.areaSqm !== undefined) body.areaSqm = payload.areaSqm
  if (payload.price !== undefined) body.price = payload.price
  if (payload.rentalPrice !== undefined) body.rentalPrice = payload.rentalPrice
  if (payload.condoFee !== undefined) body.condoFee = payload.condoFee
  if (payload.propertyTax !== undefined) body.propertyTax = payload.propertyTax
  if (payload.address !== undefined) body.address = toApiAddress(payload.address)
  if (payload.media !== undefined) body.media = toApiMedia(payload.media)

  return body
}
