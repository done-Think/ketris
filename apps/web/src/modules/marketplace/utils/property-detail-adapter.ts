import type { PublicPropertyDetail } from '../types/public-property'
import type { MarketplacePropertyDetail } from '../types/property-detail'
import type { SearchResultProperty } from '../types/search'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { PropertyText } from '../types/property-presentation'
import { formatCompactCurrency } from './search-results'
import { formatPostalCode } from '@shared/utils/postal-code'
import { formatPublicPropertyPrice } from './public-property-price'

const fallbackImage =
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82'

function buildDetails(property: PublicPropertyDetail): SearchResultProperty['details'] {
  const details: SearchResultProperty['details'] = []

  if (property.bedrooms)
    details.push({ key: 'bedrooms', label: String(property.bedrooms), value: property.bedrooms })
  if (property.bathrooms)
    details.push({
      key: 'bathrooms',
      label: String(property.bathrooms),
      value: property.bathrooms,
    })
  if (property.parkingSpots)
    details.push({
      key: 'parking',
      label: String(property.parkingSpots),
      value: property.parkingSpots,
    })
  if (property.area)
    details.push({ key: 'area', label: `${property.area}m²`, value: property.area })

  return details
}

function buildLocation(property: PublicPropertyDetail): string {
  return [property.neighborhood, property.city].filter(Boolean).join(', ')
}

function buildAddressLine(property: PublicPropertyDetail): string {
  if (!property.address) return buildLocation(property)

  return [
    `${property.address.street}, ${property.address.number}`,
    [property.address.neighborhood, `${property.address.city}/${property.address.state}`]
      .filter(Boolean)
      .join(', '),
    formatPostalCode(property.address.zipCode),
  ]
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
  locale: AppLocale,
  t: PropertyText,
  purpose?: SearchResultProperty['purpose'],
): MarketplacePropertyDetail {
  return {
    id: property.id,
    href: `/properties/${property.id}`,
    image: property.coverUrl ?? fallbackImage,
    gallery: buildGallery(property),
    location: buildLocation(property),
    title: property.title,
    category: property.propertyType,
    condominium: property.condoFee ? formatCompactCurrency(property.condoFee, locale) : '',
    price: formatPublicPropertyPrice(property, purpose, locale, t),
    details: buildDetails(property),
    description: property.description ?? '',
    address: buildAddressLine(property),
    mapCenter:
      property.latitude !== null && property.longitude !== null
        ? { latitude: property.latitude, longitude: property.longitude }
        : null,
    broker: property.brokerName ?? 'Ketris',
    brokerPhone: '',
    brokerEmail: '',
    avatar: property.brokerAvatarUrl ?? '',
  }
}
