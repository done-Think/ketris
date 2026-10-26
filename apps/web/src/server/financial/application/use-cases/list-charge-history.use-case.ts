import { ChargeNotFoundError } from '../../domain/errors'
import type { ChargeAuditEvent } from '../../types/charge-entity'
import type { GetChargeInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class ListChargeHistoryUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: GetChargeInput): Promise<ChargeAuditEvent[]> {
    assertCanAccessFinance(input.actorPapel)

    const charge = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)
    if (!charge) throw new ChargeNotFoundError()

    return this.chargeRepository.listHistory(input.actorTenantId, charge.id)
  }
}
