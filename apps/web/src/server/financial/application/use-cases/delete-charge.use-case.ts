import { assertCanDeleteCharge } from '../../domain/charge-workflow'
import { ChargeNotFoundError } from '../../domain/errors'
import type { GetChargeInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class DeleteChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: GetChargeInput): Promise<void> {
    assertCanAccessFinance(input.actorRole)

    const current = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)
    if (!current) throw new ChargeNotFoundError()

    const hasMovement = await this.chargeRepository.hasMovement(input.actorTenantId, current.id)
    assertCanDeleteCharge(current, hasMovement)

    await this.chargeRepository.delete(current, {
      tenantId: input.actorTenantId,
      actorId: input.actorId,
    })
  }
}
