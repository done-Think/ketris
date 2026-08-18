import { propertyDetails } from '../data/property-details'

type ProfileListingSource = {
  title: string
  location: string
  price: string
  href: string
}

export function buildProfileListings(listings: ProfileListingSource[]) {
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
