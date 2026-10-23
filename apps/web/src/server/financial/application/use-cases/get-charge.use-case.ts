import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../domain/charge.entity'
import type { GetChargeInput } from '../../types/charge-read'
import type { ChargeRepository } from '../ports/charge-repository.port'
import { resolveChargeReadScope } from '../charge-read-scope'

export class GetChargeUseCase {
  constructor(private readonly chargeRepository: ChargeRepository) {}

  async execute(input: GetChargeInput): Promise<Charge> {
    const scope = resolveChargeReadScope(input)
    const charge = await this.chargeRepository.findReadableById(scope, input.chargeId)

    if (!charge) {
      throw new ChargeNotFoundError()
    }

    return charge
  }
}
