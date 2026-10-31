import { createFormatter } from 'next-intl'
import { describe, expect, it } from 'vitest'

import {
  getDashboardPropertyById,
  localizeDashboardPropertyFixture,
} from '../fixtures/dashboard-properties'
import type { DashboardPropertyMappingOptions } from '../../types/dashboard-property'

const enOptions: DashboardPropertyMappingOptions = {
  locale: 'en-US',
  formatter: createFormatter({ locale: 'en-US' }),
  messages: {
    notAnnounced: 'Not announced',
    notInformed: 'Not informed',
    unknownAddress: 'Address not informed',
    monthlySuffix: '/mo',
    mediaKinds: { photo: 'Photo', floorPlan: 'Floor plan', video: 'Video' },
    purposes: { rent: 'Rent', sale: 'Sale' },
    propertyTypes: {
      apartment: 'Apartment',
      house: 'House',
      studio: 'Studio',
      penthouse: 'Penthouse',
      commercial: 'Commercial',
      loft: 'Loft',
      other: 'Other',
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
})
