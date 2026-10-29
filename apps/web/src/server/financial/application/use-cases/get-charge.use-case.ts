import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { withEffectiveStatus } from '../../domain/charge-status'
import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../types/charge-entity'
import type { GetChargeInput } from '../../types/use-case-inputs'
import { resolveChargeReadScope } from '../charge-read-scope'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class GetChargeUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: GetChargeInput): Promise<Charge> {
    const scope = resolveChargeReadScope(input)
    const charge = await this.chargeRepository.findReadableById(scope, input.chargeId)

    if (!charge) throw new ChargeNotFoundError()

    return withEffectiveStatus(charge, calendarDateInTimeZone(this.now()))
  }
}
