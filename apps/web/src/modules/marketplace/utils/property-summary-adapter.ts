import type { PublicPropertySummary } from '../types/public-property'
import type { SearchResultProperty, SearchResultPurpose } from '../types/search'
import type { AppLocale } from '@/i18n/types/locale.types'
import { formatPropertyArea, type PropertyText } from './property-presentation'
import { formatCompactCurrency } from './search-results'

function buildDetails(
  summary: PublicPropertySummary,
  locale: AppLocale,
  t: PropertyText,
): SearchResultProperty['details'] {
  const details: SearchResultProperty['details'] = []

  if (summary.bedrooms)
    details.push({ key: 'bedrooms', label: t('bedrooms', { count: summary.bedrooms }) })
  if (summary.bathrooms)
    details.push({ key: 'bathrooms', label: t('bathrooms', { count: summary.bathrooms }) })
  if (summary.parkingSpots)
    details.push({ key: 'parking', label: t('parking', { count: summary.parkingSpots }) })
  if (summary.area) details.push({ key: 'area', label: formatPropertyArea(summary.area, locale) })

  return details
}

function buildLocation(summary: PublicPropertySummary): string {
  return [summary.neighborhood, summary.city].filter(Boolean).join(', ')
}

function buildPrice(summary: PublicPropertySummary, locale: AppLocale, t: PropertyText): string {
  const formatted = formatCompactCurrency(summary.price, locale)

  return summary.purpose === 'ALUGUEL' ? t('monthly', { price: formatted }) : formatted
}

export function mapSummaryToSearchResult(
  summary: PublicPropertySummary,
  purpose: SearchResultPurpose,
  locale: AppLocale,
  t: PropertyText,
): SearchResultProperty {
  return {
    id: summary.id,
    href: `/properties/${summary.id}`,
    image: summary.coverUrl ?? '',
    location: buildLocation(summary),
    title: summary.title,
    price: buildPrice(summary, locale, t),
    details: buildDetails(summary, locale, t),
    broker: summary.brokerName ?? '',
    avatar: summary.brokerAvatarUrl ?? '',
    purpose,
    mapCenter:
      summary.latitude !== null && summary.longitude !== null
        ? { latitude: summary.latitude, longitude: summary.longitude }
        : undefined,
  }
}
