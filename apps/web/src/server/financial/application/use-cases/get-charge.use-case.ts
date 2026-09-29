import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../domain/charge.entity'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class GetChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: { actorTenantId: string; chargeId: string }): Promise<Charge> {
    const charge = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)

    if (!charge) {
      throw new ChargeNotFoundError()
    }

    return charge
  }
}
