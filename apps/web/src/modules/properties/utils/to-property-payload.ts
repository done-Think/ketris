import type { CreateDashboardPropertyFormValues } from '../types/dashboard-property'
import type { PropertyFormValues, PropertyPurpose, PropertyPayloadOptions } from '../types/property'
import { normalizePostalCode } from '@shared/utils/postal-code'

export function toPropertyPayload(
  values: CreateDashboardPropertyFormValues,
  options: PropertyPayloadOptions = {},
): PropertyFormValues {
  const hasRentPurpose = values.purpose.includes('RENT')
  const hasSalePurpose = values.purpose.includes('SALE')
  const purpose: PropertyPurpose =
    hasRentPurpose && hasSalePurpose ? 'BOTH' : hasSalePurpose ? 'SALE' : 'RENT'

  const existingAddress = options.existingAddress
  const zipCode = normalizePostalCode(values.zipCode) ?? values.zipCode
  const addressChanged = Boolean(
    existingAddress &&
    (values.street !== existingAddress.street ||
      values.number !== existingAddress.number ||
      values.neighborhood !== existingAddress.neighborhood ||
      values.city !== existingAddress.city ||
      values.state !== existingAddress.state ||
      normalizePostalCode(values.zipCode) !== normalizePostalCode(existingAddress.zipCode)),
  )

  return {
    ...(options.canChooseOwner
      ? { ownerUserId: values.ownerUserId || null, ownerContactId: values.ownerContact?.id ?? null }
      : {}),
    title: values.title,
    description: values.description,
    purpose,
    type: values.type,
    listing: {
      amenities: values.features,
      negotiationTerms: values.negotiationTerm || null,
      publishAfterReview: values.publishingOptions.includes('publishAfterReview'),
      allowWhatsappContact: values.publishingOptions.includes('allowWhatsappContact'),
      featured: values.publishingOptions.includes('featured'),
    },
    bedrooms: values.bedrooms,
    bathrooms: values.bathrooms,
    parkingSpots: values.parkingSpaces,
    areaSqm: values.area,
    price: values.mainValue,
    rentalPrice: purpose === 'BOTH' ? values.rentalValue : null,
    condoFee: values.condominium,
    propertyTax: values.propertyTax,
    address: {
      street: values.street,
      number: values.number,
      complement: values.complement || null,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
      zipCode,
      latitude: addressChanged ? null : (existingAddress?.latitude ?? null),
      longitude: addressChanged ? null : (existingAddress?.longitude ?? null),
    },
    media: values.media.map((item, index) => ({ ...item, order: index })),
  }
}
