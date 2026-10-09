import type { PublicPropertySummary } from '../types/public-property'
import type { SearchResultProperty, SearchResultPurpose } from '../types/search'
import { formatCompactCurrency } from './search-results'

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

function buildPrice(summary: PublicPropertySummary): string {
  const formatted = formatCompactCurrency(summary.price)

  return summary.purpose === 'ALUGUEL' ? `${formatted} / mês` : formatted
}

export function mapSummaryToSearchResult(
  summary: PublicPropertySummary,
  purpose: SearchResultPurpose,
): SearchResultProperty {
  return {
    id: summary.id,
    href: `/properties/${summary.id}`,
    image: summary.coverUrl ?? '',
    location: buildLocation(summary),
    title: summary.title,
    price: buildPrice(summary),
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
