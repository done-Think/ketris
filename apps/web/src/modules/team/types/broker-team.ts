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
  returns: number
  goalProgress: number
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
