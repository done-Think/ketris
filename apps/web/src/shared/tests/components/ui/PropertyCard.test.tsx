import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PropertyCard } from '../../../components/ui/PropertyCard'
import type { PropertyCardData } from '../../../types'

const commercialRoom: PropertyCardData = {
  href: '/imoveis/sala-brooklin',
  image: '',
  location: 'Brooklin, São Paulo',
  title: 'Sala comercial em Brooklin',
  price: 'R$ 4.000/mês',
  details: [
    { key: 'bathrooms', label: '1 banheiro' },
    { key: 'parking', label: '2 vagas' },
    { key: 'area', label: '238m²' },
  ],
  broker: 'Helena Prado',
  avatar: '',
}

describe('PropertyCard', () => {
  it('shows the icon of each feature for a property without bedrooms', () => {
    render(<PropertyCard property={commercialRoom} />)

    for (const [label, icon] of [
      ['1 banheiro', 'BathtubOutlinedIcon'],
      ['2 vagas', 'LocalParkingOutlinedIcon'],
      ['238m²', 'SquareFootOutlinedIcon'],
    ] as const) {
      const feature = screen.getByText(label).parentElement!
      expect(within(feature).getByTestId(icon)).toBeInTheDocument()
    }
    expect(screen.queryByTestId('BedOutlinedIcon')).not.toBeInTheDocument()
  })
})
