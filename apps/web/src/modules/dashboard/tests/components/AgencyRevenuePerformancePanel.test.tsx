import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AgencyRevenuePerformancePanel } from '../../components/AgencyRevenuePerformancePanel'
import { renderWithProviders } from '../fixtures/render'

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: ({ dataset }: { dataset: unknown[] }) => (
    <div data-testid="revenue-chart">{dataset.length}</div>
  ),
}))

describe('AgencyRevenuePerformancePanel', () => {
  it('mostra título, legenda e passa a série para o gráfico', () => {
    renderWithProviders(
      <AgencyRevenuePerformancePanel
        revenuePoints={[
          { month: 'set', revenue: 1000 },
          { month: 'out', revenue: 1500 },
        ]}
      />,
    )

    expect(screen.getByText('Performance de Faturamento')).toBeInTheDocument()
    expect(screen.getByText('Receita')).toBeInTheDocument()
    expect(screen.getByTestId('revenue-chart')).toHaveTextContent('2')
  })
})
