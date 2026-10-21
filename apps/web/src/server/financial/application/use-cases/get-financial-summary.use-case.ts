import type { FinancialSummary } from '../../domain/charge.entity'
import type { GetFinancialSummaryInput } from '../../types/charge-read'
import type { ChargeRepository } from '../ports/charge-repository.port'
import { assertCanAccessFinance } from '../assert-can-access-finance'

export class GetFinancialSummaryUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: GetFinancialSummaryInput): Promise<FinancialSummary> {
    assertCanAccessFinance(input.actorPapel)

    return this.chargeRepository.getSummary(input.actorTenantId, new Date())
  }
}
