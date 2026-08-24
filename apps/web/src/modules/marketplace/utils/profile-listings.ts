import { propertyDetails } from '../data/property-details'
import type { ProfileListingSource, PublicProfileListing } from '../types/profile-listings'

export function buildProfileListings(listings: ProfileListingSource[]): PublicProfileListing[] {
  return listings.map((listing) => {
    const listingId = listing.href.split('/').filter(Boolean).at(-1)
    const detail = listingId ? propertyDetails.find((property) => property.id === listingId) : null

    return {
      ...listing,
      image: detail?.image,
      details: detail?.details ?? [],
      category: detail?.category,
    }
  })
}

export function getPublicProfileLink(href: string) {
  return `ketris.com.br${href}`
}
