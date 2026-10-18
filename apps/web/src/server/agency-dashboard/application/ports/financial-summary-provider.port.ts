import type { FinancialSummary } from '@server/financial/domain/charge.entity'
import type { GetFinancialSummaryInput } from '@server/financial/types/charge-read'

export interface FinancialSummaryProvider {
  execute(input: GetFinancialSummaryInput): Promise<FinancialSummary>
}
