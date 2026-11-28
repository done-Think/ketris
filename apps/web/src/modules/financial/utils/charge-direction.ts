import type { ChargeDirection } from '../types/charge'

const renterChargeDirections: Record<ChargeDirection, ChargeDirection> = {
  receivable: 'payable',
  payable: 'receivable',
}

export function chargeDirectionForViewer(
  direction: ChargeDirection,
  isRenter: boolean,
): ChargeDirection {
  return isRenter ? renterChargeDirections[direction] : direction
}
