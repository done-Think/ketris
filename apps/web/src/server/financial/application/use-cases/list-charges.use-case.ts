import type { ChargeListResult } from '../../domain/charge.entity'
import type { ListChargesInput } from '../../types/charge-read'
import { assertCanReadCharges } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'
import { resolveChargeReadScope } from '../charge-read-scope'

export class ListChargesUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: ListChargesInput): Promise<ChargeListResult> {
    const { actorId, actorTenantId, actorPapel, ...filters } = input
    assertCanReadCharges(actorPapel)
    const scope = resolveChargeReadScope({ actorId, actorTenantId, actorPapel })

    if (scope.kind === 'renter' && filters.type === 'A_PAGAR') {
      return { items: [], totalCount: 0 }
    }

    return this.chargeRepository.findMany({ ...filters, scope })
  }
}
