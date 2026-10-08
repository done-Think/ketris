import type { AgencyProfile } from '../types/agency'
import type { AppLocale } from '@/i18n/types/locale.types'
import type {
  PublicAgencyListingSummary,
  PublicAgencyProfile,
} from '../types/public-agency-profile'
import { formatCompactCurrency } from './search-results'
import type { PropertyText } from './property-presentation'

function buildListingLocation(listing: PublicAgencyListingSummary): string {
  return [listing.neighborhood, listing.city].filter(Boolean).join(', ')
}

function buildListingPrice(
  listing: PublicAgencyListingSummary,
  locale: AppLocale,
  t: PropertyText,
): string {
  const formatted = formatCompactCurrency(listing.price, locale)

  return listing.purpose === 'ALUGUEL' ? t('monthly', { price: formatted }) : formatted
}

function buildLogoInitials(displayName: string): string {
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')

  return initials || '?'
}

export function toAgencyProfile(
  profile: PublicAgencyProfile,
  locale: AppLocale,
  t: PropertyText,
): AgencyProfile {
  return {
    id: profile.id,
    name: profile.displayName,
    headline: profile.headline,
    legalCreci: profile.legalCreci,
    logoInitials: buildLogoInitials(profile.displayName),
    bannerUrl: profile.bannerUrl,
    brand: {
      primaryColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      backgroundColor: profile.backgroundColor,
      logoUrl: profile.logoUrl,
    },
    headquarters: profile.headquarters,
    address: profile.address,
    coverage: profile.coverage,
    segments: profile.segments,
    activeListings: profile.stats.activeListings,
    brokersCount: profile.stats.brokersCount,
    dealsClosed: profile.stats.dealsClosed,
    responseTime: null,
    yearsInMarket: profile.yearsInMarket,
    rating: null,
    phone: profile.phone,
    email: profile.email,
    summary: profile.summary,
    href: `/agencies/${profile.id}`,
    teamHighlights: profile.team
      .slice()
      .sort((first, second) => first.order - second.order)
      .map((member) => ({
        usuarioId: member.usuarioId,
        name: member.name,
        avatarUrl: member.avatarUrl,
      })),
    featuredListings: profile.featuredListings.map((listing) => ({
      title: listing.title,
      location: buildListingLocation(listing),
      price: buildListingPrice(listing, locale, t),
      href: `/properties/${listing.id}`,
      image: listing.coverUrl ?? undefined,
    })),
  }
}
