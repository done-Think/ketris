import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AgencyBrokerDetailDialog } from '../../components/AgencyBrokerDetailDialog'
import { topBroker } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

describe('AgencyBrokerDetailDialog', () => {
  it('não renderiza sem corretor', () => {
    renderWithProviders(<AgencyBrokerDetailDialog broker={null} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra o resumo, as vendas com link para o imóvel e o perfil público', () => {
    renderWithProviders(<AgencyBrokerDetailDialog broker={topBroker} onClose={vi.fn()} />)

    expect(screen.getByText('2 vendas no período - R$ 5.000,00 em receita')).toBeInTheDocument()
    expect(screen.getByText('Últimas vendas')).toBeInTheDocument()
    expect(screen.getByText('Apartamento Batel').closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('property-1'),
    )
    expect(screen.getByRole('link', { name: /Ver perfil público/ })).toBeInTheDocument()
  })

  it('esconde o link de perfil quando o corretor não tem perfil público', () => {
    renderWithProviders(
      <AgencyBrokerDetailDialog
        broker={{ ...topBroker, hasPublicProfile: false }}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByText('Ver perfil público')).not.toBeInTheDocument()
  })
})
