import type { Papel } from '@server/auth/domain/user.entity'

import { ChargeNotFoundError } from '../../domain/errors'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export interface DeleteChargeInput {
  actorTenantId: string
  actorPapel: Papel
  chargeId: string
}

export class DeleteChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: DeleteChargeInput): Promise<void> {
    assertCanAccessFinance(input.actorPapel)

    const existing = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)

    if (!existing) {
      throw new ChargeNotFoundError()
    }

    await this.chargeRepository.delete(input.actorTenantId, input.chargeId)
  }
}
