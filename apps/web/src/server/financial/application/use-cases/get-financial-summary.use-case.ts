import type { FinancialSummary } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'
import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

export class GetFinancialSummaryUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  execute(input: { actorTenantId: string; actorPapel: Papel }): Promise<FinancialSummary> {
    if (input.actorPapel === 'RENTER') throw new ForbiddenError()
    return this.chargeRepository.getSummary(input.actorTenantId, new Date())
  }
}
