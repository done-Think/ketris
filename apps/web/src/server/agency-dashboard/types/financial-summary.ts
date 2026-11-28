import type { UserRole } from '@server/auth/domain/user.entity'

import type { AgencyRevenueMonth } from '../types/agency-overview'

export interface AgencyFinancialSummaryInput {
  actorTenantId: string
  actorRole: UserRole
}

export interface AgencyFinancialSummary {
  overdueTotal: number
  monthlySeries: AgencyRevenueMonth[]
}
