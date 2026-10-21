import type { Papel } from '@server/auth/domain/user.entity'

import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../domain/charge.entity'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class GetChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: {
    actorTenantId: string
    actorPapel: Papel
    chargeId: string
  }): Promise<Charge> {
    assertCanAccessFinance(input.actorPapel)

    const charge = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)

    if (!charge) {
      throw new ChargeNotFoundError()
    }

    return charge
  }
}
