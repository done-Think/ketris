import type { ChargeListResult } from '../../domain/charge.entity'
import type { ListChargesInput } from '../../types/charge-read'
import type { ChargeRepository } from '../ports/charge-repository.port'
import { resolveChargeReadScope } from '../charge-read-scope'

export class ListChargesUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  execute(input: ListChargesInput): Promise<ChargeListResult> {
    const { actorId, actorTenantId, actorPapel, ...filters } = input
    const scope = resolveChargeReadScope({ actorId, actorTenantId, actorPapel })

    if (scope.kind === 'renter' && filters.type === 'A_PAGAR') {
      return Promise.resolve({ items: [], totalCount: 0 })
    }

    return this.chargeRepository.findMany({ ...filters, scope })
  }
}
