import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'
import type { Papel } from '@server/auth/domain/user.entity'

export class GetChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: {
    actorTenantId: string
    actorId: string
    actorPapel: Papel
    chargeId: string
  }): Promise<Charge> {
    const charge = await this.chargeRepository.findById(
      input.actorTenantId,
      input.chargeId,
      input.actorPapel === 'RENTER' ? input.actorId : undefined,
    )

    if (!charge) {
      throw new ChargeNotFoundError()
    }

    return charge
  }
}
