import type { Papel } from '@server/auth/domain/user.entity'
import type { TimeRange } from '@server/shared/types/time-zone-calendar'

// `agentId` null means the whole agency (OWNER); otherwise only the agent's own work.
export interface DashboardScope {
  tenantId: string
  agentId: string | null
}

export interface DashboardPeriods {
  now: Date
  today: TimeRange
  month: TimeRange
}

export interface DashboardMetrics {
  activeLeads: number
  activeLeadsCreatedToday: number
  visitsThisMonth: number
  visitsToday: number
  openProposals: number
  proposalsAwaitingResponse: number
}

export type DashboardLeadStage = 'NOVO' | 'EM_CONTATO' | 'VISITA_MARCADA' | 'PROPOSTA'

export interface DashboardRecentLead {
  id: string
  name: string
  phone: string
  interest: string
  budget: string
  source: string
  stage: DashboardLeadStage
  notes: string | null
  createdAt: Date
}

export type DashboardActivityKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface DashboardUpcomingActivity {
  id: string
  title: string
  kind: DashboardActivityKind | null
  start: Date
  end: Date
  participantName: string
  participantPhone: string
  notes: string | null
  propertyId: string | null
  propertyReference: string | null
}

export interface DashboardOverview {
  metrics: DashboardMetrics
  recentLeads: DashboardRecentLead[]
  upcomingActivities: DashboardUpcomingActivity[]
}

export interface GetDashboardOverviewInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
}
