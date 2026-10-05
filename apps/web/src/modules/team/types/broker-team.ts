import type { z } from 'zod'

import type { brokerGoalSchema, brokerTransferSchema } from '../schemas/broker-team-action-schemas'

export type BrokerGoalFormValues = z.infer<typeof brokerGoalSchema>
export type BrokerTransferFormValues = z.infer<typeof brokerTransferSchema>

export type BrokerTeamStatus = 'ahead' | 'onTrack' | 'attention'

export type BrokerTeamMember = {
  id: string
  profileId: string
  name: string
  role: string
  avatarUrl: string
  properties: number
  leads: number
  monthlySales: number
  monthlyGoal: number
  returns: number
  goalProgress: number
  active: boolean
  status: BrokerTeamStatus
  specialty: string
  responseTime: string
}

export type BrokerTeamKpi = {
  id: string
  labelKey: 'activeBrokers' | 'properties' | 'monthlySales' | 'averageGoal'
  value: string
  helperKey: 'activeBrokersHelper' | 'propertiesHelper' | 'monthlySalesHelper' | 'averageGoalHelper'
}

export type BrokerTeamFiltersFormValues = {
  searchQuery: string
}

export type BrokerTeamMenuAction =
  'performance' | 'editGoal' | 'transferPortfolio' | 'scheduleOneOnOne' | 'deactivate'

export type BrokerTeamMenu = {
  anchorEl: HTMLElement
  broker: BrokerTeamMember
}

export type BrokerTeamCardProps = {
  broker: BrokerTeamMember
  isMenuOpen: boolean
  onOpenProfile: (broker: BrokerTeamMember) => void
  onOpenMenu: (anchorEl: HTMLElement, broker: BrokerTeamMember) => void
}
