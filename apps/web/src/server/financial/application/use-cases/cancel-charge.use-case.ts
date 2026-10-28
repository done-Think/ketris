import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { withEffectiveStatus } from '../../domain/charge-status'
import { assertCanSettleCharge } from '../../domain/charge-workflow'
import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../types/charge-entity'
import type { ChargeReasonInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class CancelChargeUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ChargeReasonInput): Promise<Charge> {
    assertCanAccessFinance(input.actorRole)

    const current = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)
    if (!current) throw new ChargeNotFoundError()
    assertCanSettleCharge(current)

    const cancelled = await this.chargeRepository.cancel(current, input.reason, {
      tenantId: input.actorTenantId,
      actorId: input.actorId,
    })

    return withEffectiveStatus(cancelled, calendarDateInTimeZone(this.now()))
  }
}
