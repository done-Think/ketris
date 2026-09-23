import type { AgencyProfile } from '../types/agency'
import type {
  PublicAgencyListingSummary,
  PublicAgencyProfile,
} from '../types/public-agency-profile'
import { formatCompactCurrency } from './search-results'

function buildListingLocation(listing: PublicAgencyListingSummary): string {
  return [listing.neighborhood, listing.city].filter(Boolean).join(', ')
}

function buildListingPrice(listing: PublicAgencyListingSummary): string {
  const formatted = formatCompactCurrency(listing.price)

  return listing.purpose === 'ALUGUEL' ? `${formatted} / mês` : formatted
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

export function toAgencyProfile(profile: PublicAgencyProfile): AgencyProfile {
  return {
    id: profile.id,
    name: profile.displayName,
    legalCreci: profile.legalCreci,
    logoInitials: buildLogoInitials(profile.displayName),
    brand: {
      primaryColor: profile.primaryColor,
      secondaryColor: profile.secondaryColor,
      backgroundColor: profile.backgroundColor,
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
      price: buildListingPrice(listing),
      href: `/properties/${listing.id}`,
      image: listing.coverUrl ?? undefined,
    })),
  }
}
