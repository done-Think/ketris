import type { PublicPropertyDetail } from '../types/public-property'
import type { MarketplacePropertyDetail } from '../types/property-detail'
import type { SearchResultProperty } from '../types/search'
import { formatCompactCurrency } from './search-results'

const fallbackImage =
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82'

// São Paulo (Praça da Sé) — usado só quando o imóvel não tem coordenadas cadastradas, pra manter
// o mapa central em vez de travar em (0,0), no meio do oceano.
const fallbackMapCenter = { latitude: -23.5505, longitude: -46.6333 }

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function buildDetails(property: PublicPropertyDetail): SearchResultProperty['details'] {
  const details: SearchResultProperty['details'] = []

  if (property.bedrooms)
    details.push({ key: 'bedrooms', label: pluralize(property.bedrooms, 'quarto', 'quartos') })
  if (property.bathrooms)
    details.push({
      key: 'bathrooms',
      label: pluralize(property.bathrooms, 'banheiro', 'banheiros'),
    })
  if (property.parkingSpots)
    details.push({ key: 'parking', label: pluralize(property.parkingSpots, 'vaga', 'vagas') })
  if (property.area) details.push({ key: 'area', label: `${property.area}m²` })

  return details
}

function buildLocation(property: PublicPropertyDetail): string {
  return [property.neighborhood, property.city].filter(Boolean).join(', ')
}

function buildPrice(property: PublicPropertyDetail): string {
  const formatted = formatCompactCurrency(property.price)

  return property.purpose === 'ALUGUEL' ? `${formatted} / mês` : formatted
}

function buildAddressLine(property: PublicPropertyDetail): string {
  if (!property.address) return buildLocation(property)

  return [`${property.address.street}, ${property.address.number}`, buildLocation(property)]
    .filter(Boolean)
    .join(' — ')
}

function buildGallery(property: PublicPropertyDetail): string[] {
  const urls = property.media.map((media) => media.url)

  if (urls.length > 0) return urls

  return [property.coverUrl ?? fallbackImage]
}

export function mapDetailToMarketplacePropertyDetail(
  property: PublicPropertyDetail,
): MarketplacePropertyDetail {
  return {
    id: property.id,
    href: `/properties/${property.id}`,
    image: property.coverUrl ?? fallbackImage,
    gallery: buildGallery(property),
    location: buildLocation(property),
    title: property.title,
    category: property.propertyType,
    condominium: property.condoFee ? formatCompactCurrency(property.condoFee) : 'Não informado',
    price: buildPrice(property),
    details: buildDetails(property),
    description: property.description ?? '',
    address: buildAddressLine(property),
    mapCenter:
      property.latitude !== null && property.longitude !== null
        ? { latitude: property.latitude, longitude: property.longitude }
        : fallbackMapCenter,
    broker: property.brokerName ?? 'Ketris',
    brokerPhone: '',
    brokerEmail: '',
    avatar: property.brokerAvatarUrl ?? '',
  }
}
