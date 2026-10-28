import type { ChargeChanges, StoredCharge } from '../types/charge-entity'
import type { ChargeEditableField } from '../types/charge'
import { isOpenChargeStatus } from './charge-status'
import {
  ChargeAlreadySettledError,
  ChargeHasMovementError,
  ChargeLockedError,
  ChargeNotPaidError,
} from './errors'

const lockedFields: readonly ChargeEditableField[] = ['type', 'amount', 'dueDate']

export function changedChargeFields(
  charge: StoredCharge,
  changes: ChargeChanges,
): ChargeEditableField[] {
  const changed: ChargeEditableField[] = []
  if (changes.description !== undefined && changes.description !== charge.description)
    changed.push('description')
  if (changes.type !== undefined && changes.type !== charge.type) changed.push('type')
  if (changes.amount !== undefined && changes.amount !== charge.amount) changed.push('amount')
  if (changes.dueDate !== undefined && changes.dueDate.getTime() !== charge.dueDate.getTime())
    changed.push('dueDate')
  return changed
}

export function assertCanEditCharge(charge: StoredCharge, changed: ChargeEditableField[]): void {
  if (isOpenChargeStatus(charge.storedStatus)) return
  if (changed.some((field) => lockedFields.includes(field))) throw new ChargeLockedError()
}

export function assertCanSettleCharge(charge: StoredCharge): void {
  if (!isOpenChargeStatus(charge.storedStatus)) throw new ChargeAlreadySettledError()
}

export function assertCanReversePayment(charge: StoredCharge): void {
  if (charge.storedStatus !== 'PAID') throw new ChargeNotPaidError()
}

export function assertCanDeleteCharge(charge: StoredCharge, hasMovement: boolean): void {
  if (!isOpenChargeStatus(charge.storedStatus) || hasMovement) throw new ChargeHasMovementError()
}
