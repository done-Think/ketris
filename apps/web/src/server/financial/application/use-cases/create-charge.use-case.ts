import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { withEffectiveStatus } from '../../domain/charge-status'
import { ChargeContractNotFoundError } from '../../domain/errors'
import type { Charge } from '../../types/charge-entity'
import type { CreateChargeInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class CreateChargeUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: CreateChargeInput): Promise<Charge> {
    assertCanAccessFinance(input.actorRole)

    if (input.contractId) {
      const contract = await this.chargeRepository.findContractSummary(
        input.actorTenantId,
        input.contractId,
      )
      if (!contract) throw new ChargeContractNotFoundError()
    }

    const charge = await this.chargeRepository.create(
      {
        tenantId: input.actorTenantId,
        contractId: input.contractId,
        description: input.description,
        type: input.type,
        amount: input.amount,
        dueDate: input.dueDate,
        status: input.status,
      },
      { tenantId: input.actorTenantId, actorId: input.actorId },
    )

    return withEffectiveStatus(charge, calendarDateInTimeZone(this.now()))
  }
}
