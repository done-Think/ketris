import { ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Papel } from '@server/auth/domain/user.entity'
import { theme } from '@shared/theme/theme'

import { useAgencyOverview } from '@modules/agency-dashboard/hooks/use-agency-dashboard'
import type { ApiAgencyOverview } from '@modules/agency-dashboard/types/service'
import type { AgendaEventApi } from '@modules/agenda/types/agenda-event'

import { DashboardOverviewPage } from '../../components/DashboardOverviewPage'

let papel: Papel = 'ADMIN'

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { tenantId: 'tenant-1', papel, user: { id: 'agent-1' } },
    status: 'authenticated',
  }),
}))
vi.mock('@shared/components/layout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@shared/components/layout')>()),
  DashboardNotificationsButton: () => null,
}))
vi.mock('@modules/crm/hooks/use-leads', () => ({ useLeads: () => ({ data: [] }) }))
vi.mock('@modules/crm/hooks/use-opportunities', () => ({
  useOpportunities: () => ({ data: [] }),
  useCrmProperty: () => ({ data: undefined }),
}))

function agendaEvent(id: string, responsibleId: string, title: string): AgendaEventApi {
  const start = dayjs().add(1, 'hour')

  return {
    id,
    tenantId: 'tenant-1',
    responsibleId,
    createdById: null,
    propertyId: null,
    propertyReference: null,
    title,
    kind: 'VISIT',
    status: 'CONFIRMED',
    start: start.toISOString(),
    end: start.add(1, 'hour').toISOString(),
    participantName: 'Cliente',
    participantPhone: '',
    notes: null,
    createdAt: start.toISOString(),
    updatedAt: start.toISOString(),
  }
}

vi.mock('@modules/agenda/hooks/use-agenda-events', () => ({
  useAgendaEvents: () => ({
    data: [
      agendaEvent('own', 'agent-1', 'Visita do próprio corretor'),
      agendaEvent('team', 'agent-2', 'Visita de outro corretor'),
      {
        ...agendaEvent('cancelled', 'agent-1', 'Visita cancelada'),
        status: 'CANCELLED',
      },
      {
        id: 'limited',
        propertyId: null,
        propertyReference: null,
        responsibleName: 'Corretor',
        title: 'Evento com dados limitados',
        kind: 'VISIT',
        status: 'CONFIRMED',
        start: dayjs().add(1, 'hour').toISOString(),
        end: dayjs().add(2, 'hour').toISOString(),
      },
    ],
  }),
}))

const overview: ApiAgencyOverview = {
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
    data: tenantId ? overview : undefined,
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

describe('DashboardOverviewPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each(['ADMIN', 'OWNER'] as const)(
    'mostra os números da imobiliária e a agenda da equipe para %s',
    (role) => {
      renderPage(role)

      expect(useAgencyOverview).toHaveBeenCalledWith('tenant-1')
      expect(screen.getByText('Imóveis na carteira')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('Corretores ativos')).toBeInTheDocument()
      expect(screen.getByText('Faturamento')).toBeInTheDocument()
      expect(screen.getByText('Em atraso')).toBeInTheDocument()
      expect(screen.getByText('Top Corretores')).toBeInTheDocument()
      expect(screen.getByText('Atividade Recente')).toBeInTheDocument()
      expect(screen.getByText('Leads ativos')).toBeInTheDocument()
      expect(screen.getByText('Visita do próprio corretor')).toBeInTheDocument()
      expect(screen.getByText('Visita de outro corretor')).toBeInTheDocument()
      expect(screen.queryByText('Visita cancelada')).not.toBeInTheDocument()
      expect(screen.queryByText('Evento com dados limitados')).not.toBeInTheDocument()
      expect(
        within(screen.getByText('Visitas mês').parentElement!).getByText('2'),
      ).toBeInTheDocument()
    },
  )

  it('mostra ao corretor só o trabalho dele, sem pedir os dados da imobiliária', () => {
    renderPage('AGENT')

    // The agency overview is never requested (the API would answer 403).
    expect(useAgencyOverview).toHaveBeenCalledWith(null)
    expect(useAgencyOverview).not.toHaveBeenCalledWith('tenant-1')
    expect(screen.queryByText('Imóveis na carteira')).not.toBeInTheDocument()
    expect(screen.queryByText('Faturamento')).not.toBeInTheDocument()
    expect(screen.queryByText('Em atraso')).not.toBeInTheDocument()
    expect(screen.queryByText('Top Corretores')).not.toBeInTheDocument()
    expect(screen.queryByText('Atividade Recente')).not.toBeInTheDocument()

    expect(screen.getByText('Leads ativos')).toBeInTheDocument()
    expect(screen.getByText('Próximas atividades')).toBeInTheDocument()
    expect(screen.getByText('Visita do próprio corretor')).toBeInTheDocument()
    expect(screen.queryByText('Visita de outro corretor')).not.toBeInTheDocument()
    expect(screen.queryByText('Visita cancelada')).not.toBeInTheDocument()
    expect(screen.queryByText('Evento com dados limitados')).not.toBeInTheDocument()
    expect(
      within(screen.getByText('Visitas mês').parentElement!).getByText('1'),
    ).toBeInTheDocument()
  })
})
