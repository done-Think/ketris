import type { FinancialSummary } from '@server/financial/domain/charge.entity'

export interface FinancialSummaryProvider {
  execute(input: { actorTenantId: string }): Promise<FinancialSummary>
}
