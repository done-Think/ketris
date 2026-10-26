import type { Papel } from '@server/auth/domain/user.entity'

import type { AgencyRevenueMonth } from '../types/agency-overview'

export interface AgencyFinancialSummaryInput {
  actorTenantId: string
  actorPapel: Papel
}

export interface AgencyFinancialSummary {
  monthlyReceivable: number
  overdueTotal: number
  monthlySeries: AgencyRevenueMonth[]
}
