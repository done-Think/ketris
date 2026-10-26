import type {
  AgencyFinancialSummary,
  AgencyFinancialSummaryInput,
} from '../../types/financial-summary'

export interface FinancialSummaryProvider {
  execute(input: AgencyFinancialSummaryInput): Promise<AgencyFinancialSummary>
}
