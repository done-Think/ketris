import type {
  ProfileListingOptions,
  ProfileListingSource,
  PublicProfileListing,
} from '../types/profile-listings'

export function buildProfileListings(
  listings: ProfileListingSource[],
  options: ProfileListingOptions = {},
): PublicProfileListing[] {
  const limit = options.limit ?? 6

  return listings.slice(0, limit).map((listing) => ({ ...listing, details: [] }))
}

export function getPublicProfileLink(href: string) {
  return `ketris.com.br${href}`
}
