import type { PublicPropertySummary } from '../types/public-property'
import type { SearchResultProperty, SearchResultPurpose } from '../types/search'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { PropertyText } from '../types/property-presentation'
import { formatPublicPropertyPrice } from './public-property-price'

function buildDetails(summary: PublicPropertySummary): SearchResultProperty['details'] {
  const details: SearchResultProperty['details'] = []

  if (summary.bedrooms)
    details.push({ key: 'bedrooms', label: String(summary.bedrooms), value: summary.bedrooms })
  if (summary.bathrooms)
    details.push({
      key: 'bathrooms',
      label: String(summary.bathrooms),
      value: summary.bathrooms,
    })
  if (summary.parkingSpots)
    details.push({
      key: 'parking',
      label: String(summary.parkingSpots),
      value: summary.parkingSpots,
    })
  if (summary.area) details.push({ key: 'area', label: `${summary.area}m²`, value: summary.area })

  return details
}

function buildLocation(summary: PublicPropertySummary): string {
  return [summary.neighborhood, summary.city].filter(Boolean).join(', ')
}

export function mapSummaryToSearchResult(
  summary: PublicPropertySummary,
  purpose: SearchResultPurpose,
  locale: AppLocale,
  t: PropertyText,
): SearchResultProperty {
  return {
    id: summary.id,
    href: `/properties/${summary.id}?purpose=${purpose === 'alugar' ? 'rent' : 'buy'}`,
    image: summary.coverUrl ?? '',
    location: buildLocation(summary),
    title: summary.title,
    price: formatPublicPropertyPrice(summary, purpose, locale, t),
    details: buildDetails(summary),
    broker: summary.brokerName ?? '',
    avatar: summary.brokerAvatarUrl ?? '',
    purpose,
    mapCenter:
      summary.latitude !== null && summary.longitude !== null
        ? { latitude: summary.latitude, longitude: summary.longitude }
        : undefined,
  }
}
