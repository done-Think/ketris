import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyOverviewKpiGrid } from '../../components/AgencyOverviewKpiGrid'
import type { AgencyOverviewKpi } from '../../types/agency-overview'

const kpis: AgencyOverviewKpi[] = [
  { id: 'portfolio', labelKey: 'portfolio', value: '12', helper: '', tone: 'neutral' },
  { id: 'brokers', labelKey: 'activeBrokers', value: '4', helper: '', tone: 'neutral' },
  { id: 'leads', labelKey: 'receivedLeads', value: '7', helper: '', tone: 'neutral' },
  { id: 'revenue', labelKey: 'revenue', value: 'R$ 8.500,00', helper: '', tone: 'neutral' },
  {
    id: 'occupancy',
    labelKey: 'occupancy',
    value: '67%',
    helper: '',
    tone: 'neutral',
    progress: 67,
  },
]

function renderGrid(overrides: Partial<Parameters<typeof AgencyOverviewKpiGrid>[0]> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <AgencyOverviewKpiGrid kpis={kpis} {...overrides} />
    </ThemeProvider>,
  )
}

describe('AgencyOverviewKpiGrid', () => {
  it('renderiza o valor de cada KPI vindo da API', () => {
    renderGrid()

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('R$ 8.500,00')).toBeInTheDocument()
  })

  it('mostra o anel de progresso com o percentual de ocupação', () => {
    renderGrid()

    expect(screen.getAllByText('67%')).not.toHaveLength(0)
  })

  it('não renderiza nenhum KPI quando a lista está vazia', () => {
    const { container } = renderGrid({ kpis: [] })

    expect(container.querySelectorAll('[class*=MuiTypography-root]')).toHaveLength(0)
  })
})
