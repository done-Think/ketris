import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PublicProfileListings } from '../../components/profile/PublicProfileListings'
import type { PublicProfileListing } from '../../types/profile-listings'

const listings: PublicProfileListing[] = [
  {
    title: 'Apartamento garden remodelado',
    location: 'Jardins',
    price: 'R$ 8.500/mês',
    href: '/properties/apartamento-garden-remodelado',
    details: [],
    category: 'Apartamento',
  },
]

function renderPublicProfileListings() {
  render(
    <ThemeProvider theme={theme}>
      <PublicProfileListings
        accentColor="#7C3AED"
        listings={listings}
        source={{
          href: '/brokers/marina-costa',
          name: 'Marina Costa',
          type: 'broker',
        }}
      />
    </ThemeProvider>,
  )
}

describe('PublicProfileListings', () => {
  it('makes the whole listing card a named link to the property detail page', () => {
    renderPublicProfileListings()

    const listingLink = screen.getByRole('link', {
      name: 'Ver imóvel Apartamento garden remodelado',
    })

    expect(listingLink).toHaveAttribute(
      'href',
      '/imoveis/apartamento-garden-remodelado?source=broker&sourceHref=%2Fbrokers%2Fmarina-costa&sourceName=Marina+Costa',
    )
    expect(listingLink).toHaveTextContent('Jardins / Apartamento')
    expect(listingLink).toHaveTextContent('R$ 8.500/mês')
  })
})
