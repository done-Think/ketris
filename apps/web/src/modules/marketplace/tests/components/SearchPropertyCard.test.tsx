import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SearchPropertyCard } from '../../components/SearchPropertyCard'
import type { SearchResultProperty } from '../../types/search'

const commercialRoom: SearchResultProperty = {
  id: 'property-brooklin',
  purpose: 'alugar',
  href: '/imoveis/property-brooklin',
  image: '',
  location: 'Brooklin, São Paulo',
  title: 'Sala comercial em Brooklin',
  price: 'R$ 4.000/mês',
  details: [
    { key: 'bathrooms', label: '1', value: 1 },
    { key: 'parking', label: '2', value: 2 },
    { key: 'area', label: '238m²', value: 238 },
  ],
  broker: 'Helena Prado',
  avatar: '',
}

describe('SearchPropertyCard', () => {
  it('shows the icon of each feature for a property without bedrooms', () => {
    render(<SearchPropertyCard property={commercialRoom} />)

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
