import { describe, expect, it } from 'vitest'
import { normalizeNegotiationListing } from '../../domain/property-negotiation-policy'
import { PropertyNegotiationValidationError } from '../../domain/errors'
import type { PropertyListing } from '../../types/property'
import { propertyListingSchema } from '../../schemas/property.schema'

const listing: PropertyListing = {
  amenities: [],
  negotiationTerms: 'Condição antiga preservada',
  publishAfterReview: false,
  allowWhatsappContact: false,
  featured: false,
}

describe('negotiation conditions policy', () => {
  it('rejects cash only combined with financing at both boundaries', () => {
    const input = { ...listing, negotiationConditions: ['CASH_ONLY', 'ACCEPTS_FINANCING'] as const }
    expect(propertyListingSchema.safeParse(input).success).toBe(false)
    expect(() =>
      normalizeNegotiationListing(
        { ...listing, negotiationConditions: ['CASH_ONLY', 'ACCEPTS_FINANCING'] },
        'SALE',
      ),
    ).toThrow(PropertyNegotiationValidationError)
  })
  it('preserves old text and only keeps conditions for the final purpose', () => {
    expect(
      normalizeNegotiationListing(
        { ...listing, negotiationConditions: ['REQUIRES_DEPOSIT', 'ACCEPTS_FINANCING'] },
        'RENT',
      ),
    ).toMatchObject({
      negotiationTerms: listing.negotiationTerms,
      negotiationConditions: ['REQUIRES_DEPOSIT'],
    })
    expect(normalizeNegotiationListing(listing, 'SALE')).toEqual(listing)
  })
  it('accepts deposit and financing codes while rejecting unknown or duplicate codes', () => {
    expect(
      propertyListingSchema.safeParse({ ...listing, negotiationConditions: ['REQUIRES_DEPOSIT'] })
        .success,
    ).toBe(true)
    expect(
      propertyListingSchema.safeParse({ ...listing, negotiationConditions: ['UNKNOWN'] }).success,
    ).toBe(false)
    expect(
      propertyListingSchema.safeParse({
        ...listing,
        negotiationConditions: ['ACCEPTS_FINANCING', 'ACCEPTS_FINANCING'],
      }).success,
    ).toBe(false)
  })
})
