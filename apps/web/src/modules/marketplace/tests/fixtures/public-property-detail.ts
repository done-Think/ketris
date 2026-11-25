import { mapDetailToMarketplacePropertyDetail } from '../../utils/property-detail-adapter'
import type { PublicPropertyDetail } from '../../types/public-property'
import type { SearchResultProperty } from '../../types/search'

export const publicPropertyDetail: PublicPropertyDetail = {
  id: 'property-itajuba',
  title: 'Casa em Itajubá',
  purpose: 'SALE',
  propertyType: 'HOUSE',
  price: 450000,
  condoFee: null,
  propertyTax: null,
  bedrooms: 3,
  bathrooms: 2,
  parkingSpots: 1,
  area: 90,
  city: 'Itajubá',
  neighborhood: 'Anhumas',
  latitude: null,
  longitude: null,
  brokerName: null,
  brokerAvatarUrl: null,
  coverUrl: null,
  publishedAt: null,
  description: 'Casa em Itajubá',
  media: [],
  address: {
    street: 'Rua Padre Júlio Chevalier',
    number: '35',
    complement: null,
    neighborhood: 'Anhumas',
    city: 'Itajubá',
    state: 'MG',
    zipCode: '37500-000',
    latitude: null,
    longitude: null,
  },
}

export function toMarketplacePropertyDetail(
  input = publicPropertyDetail,
  purpose?: SearchResultProperty['purpose'],
) {
  return mapDetailToMarketplacePropertyDetail(input, 'pt-BR', (key) => key, purpose)
}
