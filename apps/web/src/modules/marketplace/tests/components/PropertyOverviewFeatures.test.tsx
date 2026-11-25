import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PropertyOverview } from '../../components/property-detail/PropertyOverview'
import {
  publicPropertyDetail as property,
  toMarketplacePropertyDetail as mapped,
} from '../fixtures/public-property-detail'

vi.mock('../../components/PropertyDetailMap', () => ({
  PropertyDetailMap: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div data-testid="property-map">
      {latitude},{longitude}
    </div>
  ),
}))

describe('property overview features', () => {
  it.each([
    [
      'without bedrooms',
      { bedrooms: 0, bathrooms: 1, parkingSpots: 2, area: 238 },
      [
        ['1 banheiro', 'BathtubOutlinedIcon'],
        ['2 vagas', 'LocalParkingOutlinedIcon'],
        ['238m²', 'SquareFootOutlinedIcon'],
      ],
    ],
    [
      'without bathrooms and parking spots',
      { bedrooms: 3, bathrooms: 0, parkingSpots: 0, area: 90 },
      [
        ['3 quartos', 'BedOutlinedIcon'],
        ['90m²', 'SquareFootOutlinedIcon'],
      ],
    ],
    [
      'with every feature',
      { bedrooms: 3, bathrooms: 2, parkingSpots: 1, area: 90 },
      [
        ['3 quartos', 'BedOutlinedIcon'],
        ['2 banheiros', 'BathtubOutlinedIcon'],
        ['1 vaga', 'LocalParkingOutlinedIcon'],
        ['90m²', 'SquareFootOutlinedIcon'],
      ],
    ],
  ] as const)('shows the icon of each feature for a property %s', (_, features, expected) => {
    render(<PropertyOverview property={mapped({ ...property, ...features })} />)

    for (const [label, icon] of expected) {
      const feature = screen.getByText(label).parentElement!
      expect(within(feature).getByTestId(icon)).toBeInTheDocument()
    }
  })
})
