import { createPropertyPublishingOptions } from '../config/dashboard-property-ui'
import type {
  CreateDashboardPropertyFormValues,
  CreatePropertyPurpose,
} from '../types/dashboard-property'
import type { Property } from '../types/property'

function toDashboardPurpose(purpose: Property['purpose']): CreatePropertyPurpose[] {
  if (purpose === 'BOTH') return ['RENT', 'SALE']

  return purpose === 'SALE' ? ['SALE'] : ['RENT']
}

export function buildEditPropertyFormValues(property: Property): CreateDashboardPropertyFormValues {
  return {
    ownerUserId: property.ownerUserId ?? '',
    ownerContact: property.ownerContact ?? null,
    complement: property.address?.complement ?? '',
    type: property.type,
    purpose: toDashboardPurpose(property.purpose),
    title: property.title,
    description: property.description ?? '',
    street: property.address?.street ?? '',
    number: property.address?.number ?? '',
    neighborhood: property.address?.neighborhood ?? '',
    city: property.address?.city ?? '',
    state: property.address?.state ?? '',
    zipCode: property.address?.zipCode ?? '',
    bedrooms: property.characteristics.bedrooms ?? 0,
    bathrooms: property.characteristics.bathrooms ?? 0,
    parkingSpaces: property.characteristics.parkingSpots ?? 0,
    area: property.characteristics.areaSqm ?? 0,
    features: property.listing.amenities,
    media: property.media.map((item) => ({ url: item.url, type: item.type, order: item.order })),
    mainValue: property.values.price,
    rentalValue: property.values.rentalPrice ?? 0,
    condominium: property.values.condoFee ?? 0,
    propertyTax: property.values.propertyTax ?? 0,
    negotiationTerm: property.listing.negotiationTerms ?? '',
    publishingOptions: createPropertyPublishingOptions.filter(
      (_, index) =>
        [
          property.listing.publishAfterReview,
          property.listing.allowWhatsappContact,
          property.listing.featured,
        ][index],
    ),
  }
}
