import type { DashboardLead } from './lead'

export type FixtureLead = Omit<DashboardLead, 'lastContact' | 'lastContactAt' | 'budget'> & {
  budgetAmount: number
  budgetKind: 'sale' | 'rent'
  minutesAgo: number
}
