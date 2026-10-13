import { describe, expect, it } from 'vitest'

import {
  getDashboardPropertyById,
  localizeDashboardPropertyFixture,
} from '../../data/dashboard-properties'
import type { DashboardPropertyMappingOptions } from '../../types/dashboard-property'

const enOptions: DashboardPropertyMappingOptions = {
  locale: 'en-US',
  messages: {
    notAnnounced: 'Not announced',
    notInformed: 'Not informed',
    unknownAddress: 'Address not informed',
    monthlySuffix: '/mo',
    purposes: { rent: 'Rent', sale: 'Sale' },
    propertyTypes: {
      apartment: 'Apartment',
      house: 'House',
      studio: 'Studio',
      penthouse: 'Penthouse',
      commercial: 'Commercial',
    },
    activity: {
      created: 'Property registration completed',
      published: 'Property published',
      updated: 'Property updated',
      contractLinked: 'Active contract linked',
      photosUpdated: 'Photos updated',
      markedAsRented: 'Contract marked as rented',
      proposalApproved: 'Proposal approved',
      activatedForSale: 'Property activated for sale',
      documentationSubmitted: 'Documentation submitted for review',
      listingExpiringSoon: 'Listing nearing expiration',
      markedAsInactive: 'Property marked as inactive',
      priceAdjustment: 'Price adjusted to {price}',
      visitScheduled: 'Visit scheduled with {name}',
    },
    pricingDetails: {
      exempt: 'Exempt',
      notApplicable: 'Not applicable',
      insuranceDeposit: 'Deposit insurance',
      registrationPaused: 'Registration paused',
      installmentsDeposit: "{count} months' rent",
      feeOnRent: '{percent}% of rent',
      feeOnSale: '{percent}% of the sale',
      noRecentAdjustment: 'No recent adjustment',
      underDocumentaryReview: 'Under documentary review',
      priceValidated: 'Price validated',
      listingExpires: 'Listing expires',
      deactivated: 'Deactivated',
    },
  },
}

describe('localizeDashboardPropertyFixture', () => {
  it('translates activity labels, including the ones with dynamic content', () => {
    const property = getDashboardPropertyById('apt-jardins-3q')!
    const localized = localizeDashboardPropertyFixture(property, enOptions)

    expect(localized.activityHistory.map((entry) => entry.label)).toEqual([
      'Active contract linked',
      'Photos updated',
      'Visit scheduled with João Silva',
      'Price adjusted to R$ 6.500',
      'Property registration completed',
    ])
  })

  it('translates the administration fee and the deposit-in-installments pricing fields', () => {
    const property = getDashboardPropertyById('apt-jardins-3q')!
    const localized = localizeDashboardPropertyFixture(property, enOptions)

    expect(localized.pricing.administrationFee).toBe('8% of rent')
    expect(localized.pricing.securityDeposit).toBe("3 months' rent")
  })

  it('translates a last-adjustment value that combines a currency amount with a relative date', () => {
    const property = getDashboardPropertyById('apt-jardins-3q')!
    const localized = localizeDashboardPropertyFixture(property, enOptions)

    expect(localized.pricing.lastAdjustment).toBe('R$ 300 5 days ago')
  })

  it('translates literal deposit and adjustment placeholders', () => {
    const property = getDashboardPropertyById('studio-pinheiros')!
    const localized = localizeDashboardPropertyFixture(property, enOptions)

    expect(localized.pricing.securityDeposit).toBe('Deposit insurance')
    expect(localized.pricing.lastAdjustment).toBe('No recent adjustment')
  })
})
