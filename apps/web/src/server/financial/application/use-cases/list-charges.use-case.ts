import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { withEffectiveStatus } from '../../domain/charge-status'
import type {
  ChargeListItem,
  ChargeListResult,
  ChargeStatusCounts,
} from '../../types/charge-entity'
import type { ListChargesInput } from '../../types/use-case-inputs'
import { resolveChargeReadScope } from '../charge-read-scope'
import type { ChargeRepository } from '../ports/charge-repository.port'

const emptyStatusCounts: ChargeStatusCounts = {
  ALL: 0,
  PENDENTE: 0,
  ATRASADA: 0,
  PAGA: 0,
  AGENDADA: 0,
  CANCELADA: 0,
}

export class ListChargesUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ListChargesInput): Promise<ChargeListResult<ChargeListItem>> {
    const { actorId, actorTenantId, actorPapel, ...filters } = input
    const scope = resolveChargeReadScope({ actorId, actorTenantId, actorPapel })

    if (scope.kind === 'renter' && filters.type === 'A_PAGAR') {
      return { items: [], totalCount: 0, statusCounts: emptyStatusCounts }
    }

    const today = calendarDateInTimeZone(this.now())
    const result = await this.chargeRepository.findMany({ ...filters, scope, today })

    return {
      items: result.items.map((item) => withEffectiveStatus(item, today)),
      totalCount: result.totalCount,
      statusCounts: result.statusCounts,
    }
  }
}
