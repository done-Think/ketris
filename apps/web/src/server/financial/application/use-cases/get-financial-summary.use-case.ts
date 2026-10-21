import { ForbiddenError } from '@server/shared/errors'

import type { FinancialSummary } from '../../domain/charge.entity'
import type { GetFinancialSummaryInput } from '../../types/charge-read'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class GetFinancialSummaryUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: GetFinancialSummaryInput): Promise<FinancialSummary> {
    if (!['ADMIN', 'OWNER', 'AGENT'].includes(input.actorPapel)) {
      throw new ForbiddenError()
    }

    return this.chargeRepository.getSummary(input.actorTenantId, new Date())
  }
}
