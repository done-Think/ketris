import { conditionsForPurpose, hasConflictingConditions } from '@shared/config/property-negotiation'
import type { PropertyListing, PropertyPurpose } from '../types/property'
import { PropertyNegotiationValidationError } from './errors'

export function normalizeNegotiationListing(
  listing: PropertyListing | undefined,
  purpose: PropertyPurpose,
) {
  if (!listing || listing.negotiationConditions === undefined) return listing
  if (hasConflictingConditions(listing.negotiationConditions))
    throw new PropertyNegotiationValidationError()
  return {
    ...listing,
    negotiationConditions: conditionsForPurpose(purpose, listing.negotiationConditions),
  }
}
