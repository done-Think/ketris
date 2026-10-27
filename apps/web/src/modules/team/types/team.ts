import type { AppLocale } from '@/i18n/types/locale.types'

export type TeamPaceStatus = 'AHEAD' | 'ON_TRACK' | 'ATTENTION' | 'NO_GOAL'

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
  invitation: { status: 'PENDING' | 'EXPIRED'; sentAt: string; expiresAt: string } | null
  metrics: {
    properties: number
    openLeads: number
    monthlySales: number
    returns: number
    responseTimeMinutes: number | null
  }
  goal: { monthlySales: number; setAt: string; setByName: string } | null
  pace: { status: TeamPaceStatus; expectedSales: number | null; goalProgress: number | null }
}

export interface TeamOverview {
  month: string
  members: TeamMember[]
  summary: {
    activeBrokers: number
    properties: number
    monthlySales: number
    averageGoalProgress: number | null
  }
}

export interface TeamGoalChange {
  id: string
  monthlySales: number
  setAt: string
  setByName: string
}

export interface TeamTransferCounts {
  properties: number
  leads: number
  futureEvents: number
}

export interface TransferPortfolioPayload {
  destinationId: string
  properties: boolean
  leads: boolean
  futureEvents: boolean
}

export interface InviteBrokerPayload {
  name: string
  email: string
  locale: AppLocale
}

export interface InviteBrokerResult {
  brokerId: string
  emailDelivered: boolean
}

export interface TeamInvitationPreview {
  name: string
  email: string
  agencyName: string
  status: 'VALID' | 'EXPIRED' | 'ACCEPTED'
}

export type TeamMemberState = 'active' | 'inactive' | 'invited'

export type BrokerTeamMenuAction =
  | 'performance'
  | 'editGoal'
  | 'transferPortfolio'
  | 'scheduleOneOnOne'
  | 'deactivate'
  | 'activate'
  | 'resendInvitation'
  | 'cancelInvitation'

export type BrokerTeamDialog =
  | { type: 'invite' }
  | {
      type: Exclude<BrokerTeamMenuAction, 'activate' | 'resendInvitation'>
      member: TeamMember
    }

export interface BrokerTeamMenuState {
  anchorEl: HTMLElement
  member: TeamMember
}

export interface BrokerTeamListState {
  search: string
}
