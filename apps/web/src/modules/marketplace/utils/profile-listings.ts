import { propertyDetails } from '../data/property-details'
import type {
  ProfileListingOptions,
  ProfileListingSource,
  PublicProfileListing,
} from '../types/profile-listing'

function buildProfileListing(listing: ProfileListingSource): PublicProfileListing {
  const listingId = listing.href.split('/').filter(Boolean).at(-1)
  const detail = listingId ? propertyDetails.find((property) => property.id === listingId) : null

  return {
    ...listing,
    image: detail?.image,
    details: detail?.details ?? [],
    category: detail?.category,
  }
}

function buildListingSourceFromProperty(property: (typeof propertyDetails)[number]) {
  return {
    title: property.title,
    location: property.location,
    price: property.price,
    href: property.href,
  }
}

function propertyMatchesProfile(
  property: (typeof propertyDetails)[number],
  options: ProfileListingOptions,
) {
  if (options.brokerName && property.broker === options.brokerName) return true

  return options.coverage?.some((area) =>
    property.location.toLocaleLowerCase('pt-BR').includes(area.toLocaleLowerCase('pt-BR')),
  )
}

export function buildProfileListings(
  listings: ProfileListingSource[],
  options: ProfileListingOptions = {},
): PublicProfileListing[] {
  const limit = options.limit ?? 6
  const listingHrefs = new Set(listings.map((listing) => listing.href))
  const matchedListings = propertyDetails
    .filter(
      (property) => !listingHrefs.has(property.href) && propertyMatchesProfile(property, options),
    )
    .map(buildListingSourceFromProperty)

  const matchedHrefs = new Set([...listingHrefs, ...matchedListings.map((listing) => listing.href)])
  const fallbackListings = propertyDetails
    .filter((property) => !matchedHrefs.has(property.href))
    .map(buildListingSourceFromProperty)

  return [...listings, ...matchedListings, ...fallbackListings]
    .slice(0, limit)
    .map(buildProfileListing)
}

export function getPublicProfileLink(href: string) {
  return `ketris.com.br${href}`
}
