import type { BrokerProfile } from '../types/broker'
import type { PublicProfileEditorFormValues } from '../types/profile-editor'
import type { PublicBrokerProfile } from '../types/public-broker-profile'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { PropertyText } from '../types/property-presentation'
import { formatCompactCurrency } from './search-results'

export const emptyValues: PublicProfileEditorFormValues = {
  displayName: '',
  headline: '',
  summary: '',
  creci: '',
  phone: '',
  region: '',
  coverage: '',
  segments: '',
  availability: '',
  primaryColor: '',
  secondaryColor: '',
  backgroundColor: '',
  avatarUrl: '',
  bannerUrl: '',
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function toDraft(values: PublicProfileEditorFormValues) {
  return {
    displayName: values.displayName,
    headline: values.headline || null,
    summary: values.summary || null,
    creci: values.creci || null,
    phone: values.phone || null,
    region: values.region || null,
    coverage: splitList(values.coverage),
    segments: splitList(values.segments),
    availability: values.availability || null,
    primaryColor: values.primaryColor || null,
    secondaryColor: values.secondaryColor || null,
    backgroundColor: values.backgroundColor || null,
    avatarUrl: values.avatarUrl || null,
    bannerUrl: values.bannerUrl || null,
  }
}

export function toFormValues(profile: PublicBrokerProfile | null): PublicProfileEditorFormValues {
  if (!profile) return emptyValues

  return {
    displayName: profile.displayName,
    headline: profile.headline ?? '',
    summary: profile.summary ?? '',
    creci: profile.creci ?? '',
    phone: profile.phone ?? '',
    region: profile.region ?? '',
    coverage: profile.coverage.join(', '),
    segments: profile.segments.join(', '),
    availability: profile.availability ?? '',
    primaryColor: profile.primaryColor ?? '',
    secondaryColor: profile.secondaryColor ?? '',
    backgroundColor: profile.backgroundColor ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    bannerUrl: profile.bannerUrl ?? '',
  }
}

export function toPreviewProfile(
  values: PublicProfileEditorFormValues,
  profile: PublicBrokerProfile | null,
  locale: AppLocale,
  t: PropertyText,
  previewName: string,
): BrokerProfile {
  return {
    id: profile?.id ?? 'preview',
    agencyName: profile?.agencyName ?? '',
    email: profile?.email ?? '',
    name: values.displayName || previewName,
    headline: values.headline || null,
    creci: values.creci || null,
    avatar: values.avatarUrl || null,
    bannerUrl: values.bannerUrl || null,
    primaryColor: values.primaryColor || null,
    backgroundColor: values.backgroundColor || null,
    region: values.region || null,
    segments: splitList(values.segments),
    coverage: splitList(values.coverage),
    activeListings: profile?.stats.activeListings ?? 0,
    dealsClosed: profile?.stats.dealsClosed ?? 0,
    responseTime: null,
    rating: null,
    phone: values.phone || null,
    availability: values.availability || null,
    summary: values.summary || null,
    href: profile ? `/brokers/${profile.id}` : '',
    highlightedListings: (profile?.recentListings ?? []).map((listing) => ({
      title: listing.title,
      location: [listing.neighborhood, listing.city].filter(Boolean).join(', '),
      price:
        listing.purpose === 'RENT'
          ? t('monthly', { price: formatCompactCurrency(listing.price, locale) })
          : formatCompactCurrency(listing.price, locale),
      href: `/properties/${listing.id}`,
    })),
  }
}
