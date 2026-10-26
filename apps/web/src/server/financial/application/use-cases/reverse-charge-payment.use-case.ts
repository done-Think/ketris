import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { withEffectiveStatus } from '../../domain/charge-status'
import { assertCanReversePayment } from '../../domain/charge-workflow'
import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../types/charge-entity'
import type { ChargeReasonInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class ReverseChargePaymentUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ChargeReasonInput): Promise<Charge> {
    assertCanAccessFinance(input.actorPapel)

    const current = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)
    if (!current) throw new ChargeNotFoundError()
    assertCanReversePayment(current)

    const reversed = await this.chargeRepository.reversePayment(current, input.reason, {
      tenantId: input.actorTenantId,
      actorId: input.actorId,
    })

    return withEffectiveStatus(reversed, calendarDateInTimeZone(this.now()))
  }
}
