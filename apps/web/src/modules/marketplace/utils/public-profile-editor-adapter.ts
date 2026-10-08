import type { PublicProfileEditorFormValues } from '../schemas/public-profile-editor-schema'
import type { BrokerProfile } from '../types/broker'
import type { PublicBrokerProfile } from '../types/public-broker-profile'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { PropertyText } from './property-presentation'
import { formatCompactCurrency } from './search-results'

export const emptyValues: PublicProfileEditorFormValues = {
  displayName: '',
  headline: '',
  bio: '',
  creci: '',
  phone: '',
  region: '',
  neighborhoods: '',
  specialties: '',
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
    bio: values.bio || null,
    creci: values.creci || null,
    phone: values.phone || null,
    region: values.region || null,
    neighborhoods: splitList(values.neighborhoods),
    specialties: splitList(values.specialties),
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
    bio: profile.bio ?? '',
    creci: profile.creci ?? '',
    phone: profile.phone ?? '',
    region: profile.region ?? '',
    neighborhoods: profile.neighborhoods.join(', '),
    specialties: profile.specialties.join(', '),
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
    specialties: splitList(values.specialties),
    neighborhoods: splitList(values.neighborhoods),
    activeListings: profile?.stats.activeListings ?? 0,
    dealsClosed: profile?.stats.dealsClosed ?? 0,
    responseTime: null,
    rating: null,
    phone: values.phone || null,
    availability: values.availability || null,
    bio: values.bio || null,
    href: profile ? `/brokers/${profile.id}` : '',
    highlightedListings: (profile?.recentListings ?? []).map((listing) => ({
      title: listing.title,
      location: [listing.neighborhood, listing.city].filter(Boolean).join(', '),
      price:
        listing.purpose === 'ALUGUEL'
          ? t('monthly', { price: formatCompactCurrency(listing.price, locale) })
          : formatCompactCurrency(listing.price, locale),
      href: `/properties/${listing.id}`,
    })),
  }
}
