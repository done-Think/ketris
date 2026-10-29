import type { AppLocale } from '@/i18n/types/locale.types'

import type { TeamActor, TeamTransferItems } from './team'

export interface SetBrokerGoalInput extends TeamActor {
  brokerId: string
  monthlySales: number
}

export interface BrokerInput extends TeamActor {
  brokerId: string
}

export interface TransferBrokerPortfolioInput extends TeamActor {
  brokerId: string
  destinationId: string
  items: TeamTransferItems
}

export interface DeactivateBrokerInput extends TeamActor {
  brokerId: string
  destinationId: string
}

export interface InviteBrokerInput extends TeamActor {
  name: string
  email: string
  locale: AppLocale
}

export interface ResendTeamInvitationInput extends BrokerInput {
  locale: AppLocale
}

export interface AcceptTeamInvitationInput {
  token: string
  password: string
}

export interface InviteBrokerOutput {
  brokerId: string
  emailDelivered: boolean
}

export interface TeamInvitationPreview {
  name: string
  email: string
  agencyName: string
  status: 'VALID' | 'EXPIRED' | 'ACCEPTED'
}
