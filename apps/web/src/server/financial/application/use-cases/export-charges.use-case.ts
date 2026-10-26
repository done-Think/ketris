import { calendarDateInTimeZone } from '@server/shared/time-zone-calendar'

import { chargesCsvFileName, chargesToCsv } from '../../domain/charge-export'
import { effectiveChargeStatus } from '../../domain/charge-status'
import type { ExportChargesInput } from '../../types/use-case-inputs'
import { assertCanAccessFinance } from '../assert-can-access-finance'
import type { ChargeRepository } from '../ports/charge-repository.port'

export class ExportChargesUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ExportChargesInput): Promise<{ fileName: string; content: string }> {
    assertCanAccessFinance(input.actorPapel)

    const today = calendarDateInTimeZone(this.now())
    const charges = await this.chargeRepository.findForExport(input.actorTenantId, input.month)
    const content = chargesToCsv(
      charges.map((charge) => ({
        code: charge.code,
        description: charge.description,
        propertyTitle: charge.propertyTitle,
        payerName: charge.payerName,
        type: charge.type,
        dueDate: charge.dueDate,
        amount: charge.amount,
        status: effectiveChargeStatus(charge.storedStatus, charge.dueDate, today),
        paidAt: charge.paidAt,
        paymentMethod: charge.paymentMethod,
      })),
      input.locale,
    )

    return { fileName: chargesCsvFileName(input.month.year, input.month.month + 1), content }
  }
}
