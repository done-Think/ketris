import type { AgencyPublicProfileEditorFormValues } from '../schemas/agency-public-profile-editor-schema'
import type { AgencyProfile } from '../types/agency'
import type { PublicAgencyProfile } from '../types/public-agency-profile'

export const emptyValues: AgencyPublicProfileEditorFormValues = {
  displayName: '',
  headline: '',
  summary: '',
  legalCreci: '',
  headquarters: '',
  address: '',
  phone: '',
  email: '',
  coverage: '',
  segments: '',
  yearsInMarket: '',
  backgroundColor: '',
  logoUrl: '',
  bannerUrl: '',
  team: [],
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function toDraft(values: AgencyPublicProfileEditorFormValues) {
  return {
    displayName: values.displayName,
    headline: values.headline || null,
    summary: values.summary || null,
    legalCreci: values.legalCreci || null,
    headquarters: values.headquarters || null,
    address: values.address || null,
    phone: values.phone || null,
    email: values.email || null,
    coverage: splitList(values.coverage),
    segments: splitList(values.segments),
    yearsInMarket: values.yearsInMarket ? Number(values.yearsInMarket) : null,
    backgroundColor: values.backgroundColor || null,
    logoUrl: values.logoUrl || null,
    bannerUrl: values.bannerUrl || null,
    team: values.team.map((member, index) => ({ usuarioId: member.usuarioId, order: index })),
  }
}

export function toFormValues(
  profile: PublicAgencyProfile | null,
): AgencyPublicProfileEditorFormValues {
  if (!profile) return emptyValues

  return {
    displayName: profile.displayName,
    headline: profile.headline ?? '',
    summary: profile.summary ?? '',
    legalCreci: profile.legalCreci ?? '',
    headquarters: profile.headquarters ?? '',
    address: profile.address ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    coverage: profile.coverage.join(', '),
    segments: profile.segments.join(', '),
    yearsInMarket: profile.yearsInMarket ? String(profile.yearsInMarket) : '',
    backgroundColor: profile.backgroundColor ?? '',
    logoUrl: profile.logoUrl ?? '',
    bannerUrl: profile.bannerUrl ?? '',
    team: profile.team
      .slice()
      .sort((first, second) => first.order - second.order)
      .map((member) => ({ usuarioId: member.usuarioId, name: member.name })),
  }
}

export function toPreviewProfile(
  values: AgencyPublicProfileEditorFormValues,
  profile: PublicAgencyProfile | null,
): AgencyProfile {
  return {
    id: profile?.id ?? 'preview',
    name: values.displayName || 'Sua imobiliária',
    headline: values.headline || null,
    legalCreci: values.legalCreci || null,
    logoInitials: (values.displayName || '?').slice(0, 2).toUpperCase(),
    bannerUrl: values.bannerUrl || null,
    brand: {
      primaryColor: profile?.primaryColor ?? null,
      secondaryColor: profile?.secondaryColor ?? null,
      backgroundColor: values.backgroundColor || null,
      logoUrl: values.logoUrl || null,
    },
    headquarters: values.headquarters || null,
    address: values.address || null,
    coverage: splitList(values.coverage),
    segments: splitList(values.segments),
    activeListings: profile?.stats.activeListings ?? 0,
    brokersCount: profile?.stats.brokersCount ?? 0,
    dealsClosed: profile?.stats.dealsClosed ?? 0,
    responseTime: null,
    yearsInMarket: values.yearsInMarket ? Number(values.yearsInMarket) : null,
    rating: null,
    phone: values.phone || null,
    email: values.email || null,
    summary: values.summary || null,
    href: profile ? `/agencies/${profile.id}` : '',
    teamHighlights: values.team.map((member) => ({
      usuarioId: member.usuarioId,
      name: member.name,
      avatarUrl: null,
    })),
    featuredListings: (profile?.featuredListings ?? []).map((listing) => ({
      title: listing.title,
      location: [listing.neighborhood, listing.city].filter(Boolean).join(', '),
      price: String(listing.price),
      href: `/properties/${listing.id}`,
    })),
  }
}
