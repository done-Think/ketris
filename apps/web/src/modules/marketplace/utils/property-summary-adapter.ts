import type { PublicPropertySummary } from '../types/public-property'
import type { SearchResultProperty, SearchResultPurpose } from '../types/search'
import { formatCompactCurrency } from './search-results'

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function buildDetails(summary: PublicPropertySummary): SearchResultProperty['details'] {
  const details: SearchResultProperty['details'] = []

  if (summary.bedrooms)
    details.push({ key: 'bedrooms', label: pluralize(summary.bedrooms, 'quarto', 'quartos') })
  if (summary.bathrooms)
    details.push({ key: 'bathrooms', label: pluralize(summary.bathrooms, 'banheiro', 'banheiros') })
  if (summary.parkingSpots)
    details.push({ key: 'parking', label: pluralize(summary.parkingSpots, 'vaga', 'vagas') })
  if (summary.area) details.push({ key: 'area', label: `${summary.area}m²` })

  return details
}

function buildLocation(summary: PublicPropertySummary): string {
  return [summary.neighborhood, summary.city].filter(Boolean).join(', ')
}

function buildPrice(summary: PublicPropertySummary): string {
  const formatted = formatCompactCurrency(summary.price)

  return summary.purpose === 'ALUGUEL' ? `${formatted} / mês` : formatted
}

// O contrato público de imóveis ainda não expõe foto do corretor responsável, só o nome — o
// avatar fica vazio (sem imagem fabricada) até essa lacuna ser fechada no backend.
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
    avatar: '',
    purpose,
    mapCenter:
      summary.latitude !== null && summary.longitude !== null
        ? { latitude: summary.latitude, longitude: summary.longitude }
        : undefined,
  }
}
