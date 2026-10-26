import { calendarDateInTimeZone, calendarMonthInTimeZone } from '@server/shared/time-zone-calendar'

import { withEffectiveStatus } from '../../domain/charge-status'
import type { FinancialSummary } from '../../types/charge-entity'
import type { GetFinancialSummaryInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class GetFinancialSummaryUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: GetFinancialSummaryInput): Promise<FinancialSummary> {
    assertCanAccessFinance(input.actorPapel)

    const now = this.now()
    const today = calendarDateInTimeZone(now)
    const month = input.month ?? calendarMonthInTimeZone(now)
    const totals = await this.chargeRepository.getSummary(input.actorTenantId, month, today)

    return {
      ...totals,
      upcomingDues: totals.upcomingDues.map((due) => withEffectiveStatus(due, today)),
    }
  }
}
