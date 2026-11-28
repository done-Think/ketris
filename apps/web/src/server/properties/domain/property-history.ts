import type { Property } from '../types/property'
import type { PropertyHistoryChange, PropertyHistoryReferences } from '../types/property-history'

export const propertyHistoryActions = [
  'CREATED',
  'UPDATED',
  'PUBLISHED',
  'UNPUBLISHED',
  'INACTIVATED',
  'STATUS_CHANGED',
] as const
export const propertyHistoryFields = [
  'title',
  'description',
  'purpose',
  'type',
  'responsible',
  'brokers',
  'owner',
  'ownerContact',
  'status',
  'price',
  'rentalPrice',
  'condoFee',
  'propertyTax',
  'bedrooms',
  'bathrooms',
  'parkingSpots',
  'areaSqm',
  'listing.amenities',
  'listing.negotiationTerms',
  'listing.negotiationConditions',
  'listing.publishAfterReview',
  'listing.allowWhatsappContact',
  'listing.featured',
  'address',
  'media',
] as const

function snapshot(property: Property, references: PropertyHistoryReferences) {
  return {
    title: property.title,
    description: property.description,
    purpose: property.purpose,
    type: property.type,
    responsible: { id: property.responsibleId, name: property.responsibleName },
    brokers: [...(property.brokerIds ?? [])].sort().map((id) => ({
      id,
      name: references.brokers?.find((broker) => broker.id === id)?.name ?? null,
    })),
    owner: property.ownerId ? { id: property.ownerId, name: references.ownerName } : null,
    ownerContact: property.ownerContactId
      ? { id: property.ownerContactId, name: property.ownerContact?.name ?? null }
      : null,
    status: property.status,
    ...property.values,
    ...property.characteristics,
    'listing.amenities': property.listing.amenities,
    'listing.negotiationTerms': property.listing.negotiationTerms,
    'listing.negotiationConditions': property.listing.negotiationConditions ?? [],
    'listing.publishAfterReview': property.listing.publishAfterReview,
    'listing.allowWhatsappContact': property.listing.allowWhatsappContact,
    'listing.featured': property.listing.featured,
    address: property.address,
    media: property.media.map(({ url, type, position }) => ({ url, type, position })),
  }
}

export function propertyHistoryChanges(
  before: Property | null,
  after: Property,
  previous: PropertyHistoryReferences,
  next: PropertyHistoryReferences,
): PropertyHistoryChange[] {
  const original = before ? snapshot(before, previous) : null
  const current = snapshot(after, next)
  return propertyHistoryFields.flatMap((field) => {
    const previousValue = original?.[field] ?? null
    const nextValue = current[field]
    return JSON.stringify(previousValue) === JSON.stringify(nextValue)
      ? []
      : [{ field, before: previousValue, after: nextValue }]
  })
}
