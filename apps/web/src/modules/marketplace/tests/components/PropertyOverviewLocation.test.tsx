import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PropertyOverview } from '../../components/property-detail/PropertyOverview'
import { mapDetailToMarketplacePropertyDetail } from '../../utils/property-detail-adapter'
import type { PublicPropertyDetail } from '../../types/public-property'

vi.mock('../../components/PropertyDetailMap', () => ({
  PropertyDetailMap: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div data-testid="property-map">
      {latitude},{longitude}
    </div>
  ),
}))

const property: PublicPropertyDetail = {
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

function mapped(input = property) {
  return mapDetailToMarketplacePropertyDetail(input, 'pt-BR', (key) => key)
}

describe('property location', () => {
  it('does not invent São Paulo coordinates when the address has no coordinates', () => {
    const result = mapped()
    expect(result.mapCenter).toBeNull()
    expect(result.address).toContain('Itajubá')
    expect(result.address).toContain('MG')
  })

  it('shows an unavailable message instead of a map with an invented marker', () => {
    render(<PropertyOverview property={mapped()} />)
    expect(screen.queryByTestId('property-map')).not.toBeInTheDocument()
    expect(
      screen.getByText('Localização no mapa ainda não disponível para este endereço.'),
    ).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Buscar endereço no Google Maps' })
    const url = new URL(link.getAttribute('href')!)
    expect(url.origin).toBe('https://www.google.com')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('query')).toContain('Itajubá/MG')
  })

  it('renders the coordinates supplied for the property', () => {
    render(
      <PropertyOverview property={mapped({ ...property, latitude: -22.43, longitude: -45.45 })} />,
    )
    expect(screen.getByTestId('property-map')).toHaveTextContent('-22.43,-45.45')
  })
})
