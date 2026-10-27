import type { ApiAgencyOverview } from '../../types/agency-service'
import type { AgencyActivity, AgencyTopBroker } from '../../types/agency-overview'
import type { DashboardRecentLead, DashboardUpcomingActivity } from '../../types/dashboard-overview'
import type { ApiDashboardOverview } from '../../types/service'

export const apiDashboardOverview: ApiDashboardOverview = {
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
      source: 'SITE',
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
      propertyId: 'property-1',
      propertyReference: 'Apto Batel',
      property: {
        id: 'property-1',
        title: 'Apartamento Batel',
        price: 3200,
        address: { street: 'Rua Bispo', number: '10', neighborhood: 'Batel', city: 'Curitiba' },
      },
    },
  ],
}

export const apiAgencyOverview: ApiAgencyOverview = {
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

export const upcomingActivity: DashboardUpcomingActivity = {
  id: 'event-1',
  time: '10:00',
  title: 'Visita ao apartamento Batel',
  contact: 'Ana',
  phone: '(11) 98888-0000',
  accent: 'magenta',
  meetingTime: '10:00',
  notes: '',
  propertyId: 'property-1',
  propertyReference: 'Apto Batel',
  property: {
    title: 'Apartamento Batel',
    address: 'Rua Bispo, 10 - Batel, Curitiba',
    price: 3200,
  },
}

export const recentLead: DashboardRecentLead = {
  id: 'lead-1',
  name: 'Carlos Lima',
  phone: '(11) 90000-0000',
  interest: 'Apartamento 2 quartos',
  budget: 'Até R$ 3.000',
  source: 'SITE',
  status: 'new',
  notes: '',
}

export const agencyActivity: AgencyActivity = {
  id: 'activity-1',
  broker: 'Bruna',
  detail: 'Carlos',
  occurredAtLabel: '20/10/2026, 09:00',
  tone: 'lead',
}

export const topBroker: AgencyTopBroker = {
  id: 'broker-1',
  name: 'Marina Souza',
  profileId: 'broker-1',
  hasPublicProfile: true,
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
  ],
}
