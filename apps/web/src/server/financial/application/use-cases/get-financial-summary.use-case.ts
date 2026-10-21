import type { Papel } from '@server/auth/domain/user.entity'

import type { FinancialSummary } from '../../domain/charge.entity'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface GetFinancialSummaryInput {
  actorTenantId: string
  actorPapel: Papel
}

export class GetFinancialSummaryUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: GetFinancialSummaryInput): Promise<FinancialSummary> {
    assertCanAccessFinance(input.actorPapel)

    return this.chargeRepository.getSummary(input.actorTenantId, new Date())
  }
}
