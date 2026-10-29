import type { LeadSource } from '@shared/types/lead-source'
import type { UserRole } from '@server/auth/domain/user.entity'
import type { TimeRange } from '@server/shared/types/time-zone-calendar'

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

export type DashboardLeadStage = 'NEW' | 'IN_CONTACT' | 'VISIT_SCHEDULED' | 'PROPOSAL'

export interface DashboardRecentLead {
  id: string
  name: string
  phone: string
  interest: string
  budget: string
  source: LeadSource
  stage: DashboardLeadStage
  notes: string | null
  createdAt: Date
}

export type DashboardActivityKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface DashboardActivityPropertyAddress {
  street: string
  number: string
  neighborhood: string
  city: string
}

export interface DashboardActivityProperty {
  id: string
  title: string
  price: number
  address: DashboardActivityPropertyAddress | null
}

export type DashboardPropertyStatus = 'DRAFT' | 'PUBLISHED' | 'RENTED' | 'SOLD' | 'INACTIVE'

export interface DashboardActivityPropertySource extends DashboardActivityProperty {
  status: DashboardPropertyStatus
}

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
  property: DashboardActivityProperty | null
}

export interface DashboardOverview {
  metrics: DashboardMetrics
  recentLeads: DashboardRecentLead[]
  upcomingActivities: DashboardUpcomingActivity[]
}

export interface GetDashboardOverviewInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
}
