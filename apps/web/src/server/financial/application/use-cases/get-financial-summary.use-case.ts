import type { FinancialSummary } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class GetFinancialSummaryUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  execute(input: { actorTenantId: string }): Promise<FinancialSummary> {
    return this.chargeRepository.getSummary(input.actorTenantId, new Date())
  }
}
