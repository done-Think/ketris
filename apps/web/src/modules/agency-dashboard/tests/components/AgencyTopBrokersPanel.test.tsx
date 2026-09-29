import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyTopBrokersPanel } from '../../components/AgencyTopBrokersPanel'
import type { AgencyTopBroker } from '../../types/agency-overview'

const topBrokers: AgencyTopBroker[] = [
  {
    id: 'broker-1',
    name: 'Marina Souza',
    profileId: 'broker-1',
    sales: 2,
    revenue: 'R$ 5.000,00',
    avatarUrl: null,
    recentSales: [
      {
        id: 'contract-1',
        propertyId: 'property-1',
        property: 'Apartamento Batel',
        location: 'Batel, Curitiba',
        value: 'R$ 3.000,00',
        closedAt: '20/09/2026',
      },
      {
        id: 'contract-2',
        propertyId: 'property-2',
        property: 'Casa Vendida',
        location: null,
        value: 'R$ 2.000,00',
        closedAt: '10/09/2026',
      },
    ],
  },
]

function renderPanel() {
  return render(
    <ThemeProvider theme={theme}>
      <AgencyTopBrokersPanel topBrokers={topBrokers} />
    </ThemeProvider>,
  )
}

describe('AgencyTopBrokersPanel', () => {
  it('lista os corretores recebidos via prop com vendas e receita', () => {
    renderPanel()

    expect(screen.getByText('Marina Souza')).toBeInTheDocument()
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument()
  })

  it('não renderiza nenhum corretor quando a lista está vazia', () => {
    render(
      <ThemeProvider theme={theme}>
        <AgencyTopBrokersPanel topBrokers={[]} />
      </ThemeProvider>,
    )

    expect(screen.queryByText('Marina Souza')).not.toBeInTheDocument()
  })

  it('abre o dialog de detalhe com as vendas recentes ao clicar no corretor', async () => {
    renderPanel()

    await userEvent.click(screen.getByText('Marina Souza'))

    expect(screen.getByText('Apartamento Batel')).toBeInTheDocument()
    expect(screen.getByText(/Batel, Curitiba/)).toBeInTheDocument()
    expect(screen.getByText('Casa Vendida')).toBeInTheDocument()
  })
})
