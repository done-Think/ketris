import type { CalendarMonth } from '@server/shared/types/time-zone-calendar'

import type {
  ChargeAuditEvent,
  ChargeChanges,
  ChargeListFilters,
  ChargeListResult,
  ChargeMutationActor,
  ChargePaymentData,
  FinancialSummaryTotals,
  NewCharge,
  StoredCharge,
  StoredChargeListItem,
} from '../../types/charge-entity'
import type { ChargeReadScope } from '../../types/charge-read-scope'
import type { ChargeEditableField } from '../../types/charge'
import type { StoredChargeReceiptFile } from '../../types/charge-receipt'

export interface ChargeRepository {
  findContractSummary(tenantId: string, contractId: string): Promise<{ id: string } | null>
  create(input: NewCharge, actor: ChargeMutationActor): Promise<StoredCharge>
  findMany(filters: ChargeListFilters): Promise<ChargeListResult<StoredChargeListItem>>
  findById(tenantId: string, chargeId: string): Promise<StoredCharge | null>
  findReadableById(scope: ChargeReadScope, chargeId: string): Promise<StoredCharge | null>
  hasMovement(tenantId: string, chargeId: string): Promise<boolean>
  update(
    current: StoredCharge,
    changes: ChargeChanges,
    changedFields: ChargeEditableField[],
    actor: ChargeMutationActor,
  ): Promise<StoredCharge>
  registerPayment(
    current: StoredCharge,
    payment: ChargePaymentData,
    actor: ChargeMutationActor,
  ): Promise<StoredCharge>
  reversePayment(
    current: StoredCharge,
    reason: string,
    actor: ChargeMutationActor,
  ): Promise<StoredCharge>
  cancel(current: StoredCharge, reason: string, actor: ChargeMutationActor): Promise<StoredCharge>
  delete(current: StoredCharge, actor: ChargeMutationActor): Promise<void>
  listHistory(tenantId: string, chargeId: string): Promise<ChargeAuditEvent[]>
  findReceipt(
    scope: ChargeReadScope,
    chargeId: string,
    receiptId: string,
    includeHistory: boolean,
  ): Promise<StoredChargeReceiptFile | null>
  getSummary(tenantId: string, month: CalendarMonth, today: Date): Promise<FinancialSummaryTotals>
  findForExport(tenantId: string, month: CalendarMonth): Promise<StoredCharge[]>
}
