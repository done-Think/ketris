import type { Papel } from '@server/auth/domain/user.entity'
import type { FinancialSummary } from '@server/financial/domain/charge.entity'

export interface FinancialSummaryProvider {
  execute(input: { actorTenantId: string; actorPapel: Papel }): Promise<FinancialSummary>
}
