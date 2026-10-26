import type { Papel } from '@server/auth/domain/user.entity'

import type { AgencyRevenueMonth } from '../domain/agency-overview.entity'

export interface AgencyFinancialSummaryInput {
  actorTenantId: string
  actorPapel: Papel
}

// Only what the agency overview reads from the financial summary.
export interface AgencyFinancialSummary {
  monthlyReceivable: number
  overdueTotal: number
  monthlySeries: AgencyRevenueMonth[]
}
