import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DashboardMetricGrid } from '../../components/DashboardMetricGrid'
import { renderWithProviders } from '../fixtures/render'

describe('DashboardMetricGrid', () => {
  it('mostra rótulo, valor e legenda de cada card', () => {
    renderWithProviders(
      <DashboardMetricGrid
        metrics={[
          { label: 'Leads ativos', value: '6', caption: '2 hoje', tone: 'success' },
          { label: 'Propostas', value: '3', caption: '1 aguardando resposta', tone: 'danger' },
          { label: 'Sem legenda', value: '0' },
        ]}
      />,
    )

    expect(screen.getByText('Leads ativos')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('2 hoje')).toBeInTheDocument()
    expect(screen.getByText('1 aguardando resposta')).toBeInTheDocument()
    expect(screen.getByText('Sem legenda')).toBeInTheDocument()
  })
})
