import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { withEffectiveStatus } from '../../domain/charge-status'
import { assertCanEditCharge, changedChargeFields } from '../../domain/charge-workflow'
import { ChargeNotFoundError } from '../../domain/errors'
import type { Charge } from '../../types/charge-entity'
import type { UpdateChargeInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class UpdateChargeUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: UpdateChargeInput): Promise<Charge> {
    assertCanAccessFinance(input.actorRole)

    const current = await this.chargeRepository.findById(input.actorTenantId, input.chargeId)
    if (!current) throw new ChargeNotFoundError()

    const changes = {
      description: input.description,
      type: input.type,
      amount: input.amount,
      dueDate: input.dueDate,
    }
    const changed = changedChargeFields(current, changes)
    assertCanEditCharge(current, changed)

    const today = calendarDateInTimeZone(this.now())
    if (changed.length === 0) return withEffectiveStatus(current, today)

    const updated = await this.chargeRepository.update(current, changes, changed, {
      tenantId: input.actorTenantId,
      actorId: input.actorId,
    })

    return withEffectiveStatus(updated, today)
  }
}
