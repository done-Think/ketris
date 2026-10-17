import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyOverviewKpiGrid } from '../../components/AgencyOverviewKpiGrid'
import type { AgencyOverviewKpi } from '../../types/agency-overview'

const kpis: AgencyOverviewKpi[] = [
  {
    id: 'portfolio',
    labelKey: 'portfolio',
    value: '12',
    helper: { key: 'newProperties', values: { count: 1 } },
    tone: 'success',
  },
  { id: 'brokers', labelKey: 'activeBrokers', value: '4', tone: 'neutral' },
  {
    id: 'leads',
    labelKey: 'receivedLeads',
    value: '7',
    helper: { key: 'leadsDecrease', values: { count: 2 } },
    tone: 'neutral',
  },
  {
    id: 'revenue',
    labelKey: 'revenue',
    value: 'R$ 8.500,00',
    helper: { key: 'revenueIncrease', values: { percent: 12 } },
    tone: 'success',
  },
  {
    id: 'occupancy',
    labelKey: 'occupancy',
    value: '67%',
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

  it('mostra a comparação traduzida abaixo do valor de cada KPI', () => {
    renderGrid()

    expect(screen.getByText('+1 novo este mês')).toBeInTheDocument()
    expect(screen.getByText('−2 vs mês passado')).toBeInTheDocument()
    expect(screen.getByText('+12% vs mês passado')).toBeInTheDocument()
  })

  it('usa o plural e o texto de "nenhum" para imóveis novos', () => {
    renderGrid({
      kpis: [
        { ...kpis[0], helper: { key: 'newProperties', values: { count: 3 } } },
        {
          ...kpis[1],
          id: 'portfolio-zero',
          helper: { key: 'newProperties', values: { count: 0 } },
        },
      ],
    })

    expect(screen.getByText('+3 novos este mês')).toBeInTheDocument()
    expect(screen.getByText('Nenhum novo este mês')).toBeInTheDocument()
  })

  it('não mostra linha de comparação nos KPIs sem comparação', () => {
    renderGrid({ kpis: [kpis[1]] })

    expect(screen.queryByText(/mês passado|este mês/)).not.toBeInTheDocument()
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
