import type { BrokerProfile } from '../types/broker'
import type { AppLocale } from '@/i18n/types/locale.types'
import type {
  PublicBrokerListingSummary,
  PublicBrokerProfile,
} from '../types/public-broker-profile'
import { formatCompactCurrency } from './search-results'
import type { PropertyText } from './property-presentation'

function buildListingLocation(listing: PublicBrokerListingSummary): string {
  return [listing.neighborhood, listing.city].filter(Boolean).join(', ')
}

function buildListingPrice(
  listing: PublicBrokerListingSummary,
  locale: AppLocale,
  t: PropertyText,
): string {
  const formatted = formatCompactCurrency(listing.price, locale)

  return listing.purpose === 'ALUGUEL' ? t('monthly', { price: formatted }) : formatted
}

export function toBrokerProfile(
  profile: PublicBrokerProfile,
  locale: AppLocale,
  t: PropertyText,
): BrokerProfile {
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
      price: buildListingPrice(listing, locale, t),
      href: `/properties/${listing.id}`,
      image: listing.coverUrl ?? undefined,
    })),
  }
}
