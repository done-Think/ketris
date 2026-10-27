import type { LeadSource } from '@server/crm/constants/lead-sources'
export interface ApiDashboardMetrics {
  activeLeads: number
  activeLeadsCreatedToday: number
  visitsThisMonth: number
  visitsToday: number
  openProposals: number
  proposalsAwaitingResponse: number
}

export type ApiDashboardLeadStage = 'NOVO' | 'EM_CONTATO' | 'VISITA_MARCADA' | 'PROPOSTA'

export interface ApiDashboardRecentLead {
  id: string
  name: string
  phone: string
  interest: string
  budget: string
  source: LeadSource
  stage: ApiDashboardLeadStage
  notes: string | null
  createdAt: string
}

export type ApiDashboardActivityKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface ApiDashboardActivityProperty {
  id: string
  title: string
  price: number
  address: {
    street: string
    number: string
    neighborhood: string
    city: string
  } | null
}

export interface ApiDashboardUpcomingActivity {
  id: string
  title: string
  kind: ApiDashboardActivityKind | null
  start: string
  end: string
  participantName: string
  participantPhone: string
  notes: string | null
  propertyId: string | null
  propertyReference: string | null
  property: ApiDashboardActivityProperty | null
}

export interface ApiDashboardOverview {
  metrics: ApiDashboardMetrics
  recentLeads: ApiDashboardRecentLead[]
  upcomingActivities: ApiDashboardUpcomingActivity[]
}
