import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { BrokerCard } from '../../components/BrokerCard'
import type { BrokerCardProps } from '../../types/broker'

const broker: BrokerCardProps = {
  id: 'marina-costa',
  name: 'Marina Costa',
  creci: 'CRECI 123456-F',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  region: 'Jardins, São Paulo',
  specialties: ['Aluguel', 'Alto padrão'],
  neighborhoods: ['Jardins', 'Itaim Bibi'],
  activeListings: 42,
  responseTime: '15 min',
  rating: 5,
  dealsClosed: 128,
  phone: '(11) 99822-1104',
  email: 'marina@ketris.com.br',
  availability: 'Segunda a sexta, 9h às 18h',
  bio: 'Atuação focada em apartamentos prontos para morar nos Jardins.',
  href: '/brokers/marina-costa',
  highlightedListings: [
    {
      title: 'Apartamento espaçoso com vista para o parque',
      location: 'Jardins',
      price: 'R$ 4.800 / mês',
      href: '/properties/apartamento-jardins',
    },
    {
      title: 'Apartamento Garden Remodelado',
      location: 'Jardins',
      price: 'R$ 6.200 / mês',
      href: '/properties/apartamento-garden-remodelado',
    },
  ],
  viewMode: 'list',
}

function renderBrokerCard() {
  render(
    <ThemeProvider theme={theme}>
      <BrokerCard {...broker} />
    </ThemeProvider>,
  )
}

describe('BrokerCard', () => {
  it('formats whole ratings with one decimal place', () => {
    renderBrokerCard()

    expect(screen.getByText('5.0')).toBeInTheDocument()
  })

  it('keeps the whole broker card linked while preserving featured listing links', () => {
    renderBrokerCard()

    const profileLink = screen.getByRole('link', { name: 'Ver página pública de Marina Costa' })
    const profileClick = vi.spyOn(profileLink, 'click').mockImplementation(() => undefined)

    expect(profileLink).toHaveAttribute('href', '/corretores/marina-costa')

    fireEvent.click(screen.getByText('Marina Costa'))

    expect(profileClick).toHaveBeenCalledTimes(1)

    const listingLink = screen.getByRole('link', { name: /R\$ 4\.800 \/ mês/i })

    expect(listingLink).toHaveAttribute('href', '/imoveis/apartamento-jardins')

    listingLink.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(listingLink)

    expect(profileClick).toHaveBeenCalledTimes(1)
  })

  it('shows the broker region tooltip inside the clickable card', async () => {
    const user = userEvent.setup()
    renderBrokerCard()

    await user.hover(screen.getAllByText('Jardins, São Paulo')[1])

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Jardins, São Paulo')
  })
})
