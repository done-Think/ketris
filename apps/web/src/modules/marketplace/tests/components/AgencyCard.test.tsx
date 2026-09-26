import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyCard } from '../../components/AgencyCard'
import type { AgencyCardProps } from '../../types/agency'

const agency: AgencyCardProps = {
  id: 'alameda-prime',
  name: 'Alameda Prime Imóveis',
  headline: null,
  legalCreci: 'CRECI J-38210',
  logoInitials: 'AP',
  bannerUrl: null,
  brand: {
    primaryColor: '#F30274',
    secondaryColor: '#212631',
    backgroundColor: '#FFFFFF',
    logoUrl: null,
  },
  headquarters: 'Jardins, São Paulo',
  coverage: ['Jardins', 'Itaim Bibi'],
  segments: ['Residencial', 'Alto padrão', 'Administração'],
  activeListings: 128,
  brokersCount: 18,
  responseTime: '11 min',
  yearsInMarket: 14,
  dealsClosed: 420,
  rating: null,
  phone: '(11) 3042-9000',
  email: 'parcerias@alamedaprime.com.br',
  address: 'Alameda Santos, 1320 - Jardins',
  summary: 'Operação focada em imóveis residenciais de alto padrão nos Jardins.',
  href: '/agencies/alameda-prime',
  teamHighlights: [
    { usuarioId: 'marina-costa', name: 'Marina Costa', avatarUrl: null },
    { usuarioId: 'juliana-mendes', name: 'Juliana Mendes', avatarUrl: null },
  ],
  featuredListings: [
    {
      title: 'Apartamento pronto para morar perto da Oscar Freire',
      location: 'Jardins',
      price: 'R$ 1.420.000',
      href: '/properties/apartamento-jardins-venda',
    },
    {
      title: 'Cobertura tríplex com piscina privativa',
      location: 'Itaim Bibi',
      price: 'R$ 12.500 / mês',
      href: '/properties/cobertura-itaim-bibi',
    },
  ],
  viewMode: 'list',
}

function renderAgencyCard() {
  render(
    <ThemeProvider theme={theme}>
      <AgencyCard {...agency} />
    </ThemeProvider>,
  )
}

describe('AgencyCard', () => {
  it('keeps the whole agency card linked while preserving featured listing links', () => {
    renderAgencyCard()

    const profileLink = screen.getByRole('link', {
      name: 'Ver página pública de Alameda Prime Imóveis',
    })
    const profileClick = vi.spyOn(profileLink, 'click').mockImplementation(() => undefined)

    expect(profileLink).toHaveAttribute('href', '/imobiliarias/alameda-prime')

    fireEvent.click(screen.getAllByText('Alameda Prime Imóveis')[0])

    expect(profileClick).toHaveBeenCalledTimes(1)

    const listingLink = screen.getByRole('link', { name: /R\$ 1\.420\.000/i })

    expect(listingLink).toHaveAttribute('href', '/imoveis/apartamento-jardins-venda')

    listingLink.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(listingLink)

    expect(profileClick).toHaveBeenCalledTimes(1)
  })
})
