import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AgencyExchangeRateNotice } from '../../components/AgencyExchangeRateNotice'
import { renderWithProviders } from '../fixtures/render'

describe('AgencyExchangeRateNotice', () => {
  it('não mostra nada em BRL', () => {
    const { container } = renderWithProviders(
      <AgencyExchangeRateNotice targetCurrency="BRL" exchangeRate={undefined} isPending={false} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('mostra a cotação usada', () => {
    renderWithProviders(
      <AgencyExchangeRateNotice
        targetCurrency="USD"
        exchangeRate={{ currency: 'USD', brlPerUnit: 5.4321, date: '2026-10-20' }}
        isPending={false}
      />,
    )

    expect(screen.getByText(/1 USD = R\$ 5,4321/)).toBeInTheDocument()
    expect(screen.getByText(/20\/10\/2026/)).toBeInTheDocument()
  })

  it('avisa enquanto carrega e quando a cotação falha', () => {
    const { rerender } = renderWithProviders(
      <AgencyExchangeRateNotice targetCurrency="EUR" exchangeRate={undefined} isPending />,
    )
    expect(screen.getByText(/Consultando a cotação PTAX/)).toBeInTheDocument()

    rerender(
      <AgencyExchangeRateNotice targetCurrency="EUR" exchangeRate={undefined} isPending={false} />,
    )
    expect(screen.getByText(/Cotação indisponível/)).toBeInTheDocument()
  })
})
