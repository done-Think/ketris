import type { Papel } from '@server/auth/domain/user.entity'

export type TeamPaceStatus = 'AHEAD' | 'ON_TRACK' | 'ATTENTION' | 'NO_GOAL'

export type TeamInvitationStatus = 'PENDING' | 'EXPIRED'

export interface TeamActor {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
}

export interface TeamMemberMetrics {
  properties: number
  openLeads: number
  monthlySales: number
  returns: number
  responseTimeMinutes: number | null
}

export interface TeamMemberGoal {
  monthlySales: number
  setAt: Date
  setByName: string
}

export interface TeamMemberPace {
  status: TeamPaceStatus
  expectedSales: number | null
  goalProgress: number | null
}

export interface TeamMemberInvitation {
  status: TeamInvitationStatus
  sentAt: Date
  expiresAt: Date
}

export interface TeamMember {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  headline: string | null
  specialties: string[]
  hasPublicProfile: boolean
  active: boolean
  invitation: TeamMemberInvitation | null
  metrics: TeamMemberMetrics
  goal: TeamMemberGoal | null
  pace: TeamMemberPace
}

export interface TeamSummary {
  activeBrokers: number
  properties: number
  monthlySales: number
  averageGoalProgress: number | null
}

export interface TeamOverview {
  month: string
  members: TeamMember[]
  summary: TeamSummary
}

export interface TeamPeriod {
  now: Date
  monthStart: Date
  monthEnd: Date
  responseWindowStart: Date
}

export interface TeamTransferItems {
  properties: boolean
  leads: boolean
  futureEvents: boolean
}

export interface TeamTransferResult {
  propertyIds: string[]
  leadIds: string[]
  eventIds: string[]
}

export interface TeamGoalChange {
  id: string
  monthlySales: number
  setAt: Date
  setByName: string
}
