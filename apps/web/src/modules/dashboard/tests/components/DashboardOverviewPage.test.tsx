import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Papel } from '@server/auth/domain/user.entity'
import { theme } from '@shared/theme/theme'

import { useAgencyOverview } from '@modules/agency-dashboard/hooks/use-agency-dashboard'
import type { ApiAgencyOverview } from '@modules/agency-dashboard/types/service'

import { DashboardOverviewPage } from '../../components/DashboardOverviewPage'
import { useDashboardOverview } from '../../hooks/use-dashboard-overview'
import type { ApiDashboardOverview } from '../../types/service'

let papel: Papel = 'OWNER'

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { tenantId: 'tenant-1', role: papel, user: { id: 'agent-1' } },
    status: 'authenticated',
  }),
}))
vi.mock('@shared/components/layout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/components/layout')>()),
  DashboardNotificationsButton: () => null,
}))
vi.mock('@modules/crm/hooks/use-opportunities', () => ({
  useCrmProperty: () => ({ data: undefined }),
}))

const dashboardOverview: ApiDashboardOverview = {
  metrics: {
    activeLeads: 6,
    activeLeadsCreatedToday: 2,
    visitsThisMonth: 4,
    visitsToday: 1,
    openProposals: 3,
    proposalsAwaitingResponse: 1,
  },
  recentLeads: [
    {
      id: 'lead-1',
      name: 'Carlos Lima',
      phone: '(11) 90000-0000',
      interest: 'Apartamento 2 quartos',
      budget: 'Até R$ 3.000',
      source: 'Site',
      stage: 'NOVO',
      notes: null,
      createdAt: '2026-10-20T12:00:00.000Z',
    },
  ],
  upcomingActivities: [
    {
      id: 'event-1',
      title: 'Visita ao apartamento Batel',
      kind: 'VISIT',
      start: '2026-10-21T13:00:00.000Z',
      end: '2026-10-21T14:00:00.000Z',
      participantName: 'Ana',
      participantPhone: '(11) 98888-0000',
      notes: null,
      propertyId: null,
      propertyReference: 'Apto Batel',
    },
  ],
}

vi.mock('../../hooks/use-dashboard-overview', () => ({
  useDashboardOverview: vi.fn(() => ({ data: dashboardOverview })),
}))

const agencyOverview: ApiAgencyOverview = {
  kpis: {
    portfolioCount: 42,
    newPropertiesThisMonth: 2,
    activeBrokersCount: 7,
    receivedLeadsThisMonth: 9,
    receivedLeadsPreviousPeriod: 5,
    monthlyReceivable: 12000,
    monthlyReceivablePreviousMonth: 10000,
    overdueTotal: 450,
    occupancyPercentage: 80,
  },
  revenueSeries: [],
  topBrokers: [],
  recentActivities: [
    {
      id: 'activity-1',
      type: 'LEAD',
      brokerName: 'Bruna',
      detail: 'Carlos',
      occurredAt: '2026-10-20T12:00:00.000Z',
    },
  ],
}

vi.mock('@modules/agency-dashboard/hooks/use-agency-dashboard', () => ({
  useAgencyOverview: vi.fn((tenantId: string | null | undefined) => ({
    data: tenantId ? agencyOverview : undefined,
  })),
}))

function renderPage(role: Papel) {
  papel = role

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={theme}>
        <DashboardOverviewPage />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

function metricValue(label: string) {
  return within(screen.getByText(label).parentElement!)
}

describe('DashboardOverviewPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra os números do endpoint agregado, sem calcular nada no navegador', () => {
    renderPage('AGENT')

    expect(useDashboardOverview).toHaveBeenCalledWith('tenant-1', 'agent-1')
    expect(metricValue('Leads ativos').getByText('6')).toBeInTheDocument()
    expect(metricValue('Visitas mês').getByText('4')).toBeInTheDocument()
    expect(metricValue('Propostas').getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Visita ao apartamento Batel')).toBeInTheDocument()
    expect(screen.getByText('Carlos Lima')).toBeInTheDocument()
  })

  it('mostra os números da imobiliária para o OWNER', () => {
    renderPage('OWNER')

    expect(useAgencyOverview).toHaveBeenCalledWith('tenant-1')
    expect(screen.getByText('Imóveis na carteira')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Top Corretores')).toBeInTheDocument()
    expect(screen.getByText('Atividade Recente')).toBeInTheDocument()
    expect(screen.getByText('Leads ativos')).toBeInTheDocument()
  })

  it('não pede os dados da imobiliária para o corretor', () => {
    renderPage('AGENT')

    expect(useAgencyOverview).toHaveBeenCalledWith(null)
    expect(useAgencyOverview).not.toHaveBeenCalledWith('tenant-1')
    expect(screen.queryByText('Imóveis na carteira')).not.toBeInTheDocument()
    expect(screen.queryByText('Top Corretores')).not.toBeInTheDocument()
    expect(screen.getByText('Próximas atividades')).toBeInTheDocument()
  })

  it('mostra os cards zerados enquanto o endpoint carrega', () => {
    vi.mocked(useDashboardOverview).mockReturnValueOnce({ data: undefined } as never)
    renderPage('AGENT')

    expect(metricValue('Leads ativos').getByText('0')).toBeInTheDocument()
  })
})
