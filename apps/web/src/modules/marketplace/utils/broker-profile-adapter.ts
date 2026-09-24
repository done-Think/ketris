import type { BrokerProfile } from '../types/broker'
import type {
  PublicBrokerListingSummary,
  PublicBrokerProfile,
} from '../types/public-broker-profile'
import { formatCompactCurrency } from './search-results'

function buildListingLocation(listing: PublicBrokerListingSummary): string {
  return [listing.neighborhood, listing.city].filter(Boolean).join(', ')
}

function buildListingPrice(listing: PublicBrokerListingSummary): string {
  const formatted = formatCompactCurrency(listing.price)

  return listing.purpose === 'ALUGUEL' ? `${formatted} / mês` : formatted
}

export function toBrokerProfile(profile: PublicBrokerProfile): BrokerProfile {
  return {
    id: profile.id,
    agencyName: profile.agencyName,
    email: profile.email,
    name: profile.displayName,
    headline: profile.headline,
    creci: profile.creci,
    avatar: profile.avatarUrl,
    bannerUrl: profile.bannerUrl,
    primaryColor: profile.primaryColor,
    backgroundColor: profile.backgroundColor,
    region: profile.region,
    specialties: profile.specialties,
    neighborhoods: profile.neighborhoods,
    activeListings: profile.stats.activeListings,
    dealsClosed: profile.stats.dealsClosed,
    responseTime: null,
    rating: null,
    phone: profile.phone,
    availability: profile.availability,
    bio: profile.bio,
    href: `/brokers/${profile.id}`,
    highlightedListings: profile.recentListings.map((listing) => ({
      title: listing.title,
      location: buildListingLocation(listing),
      price: buildListingPrice(listing),
      href: `/properties/${listing.id}`,
      image: listing.coverUrl ?? undefined,
    })),
  }
}
