import type { PropertyNegotiationCondition } from '@shared/types/property-negotiation'

export const saleNegotiationConditions = [
  'ACCEPTS_FINANCING',
  'REQUIRES_DOWN_PAYMENT',
  'CASH_ONLY',
  'ACCEPTS_EXCHANGE',
  'SALE_NEGOTIABLE',
] as const

export const rentalNegotiationConditions = [
  'AGREE_WITH_OWNER',
  'RENT_NEGOTIABLE',
  'REQUIRES_DEPOSIT',
] as const

export const propertyNegotiationConditions = [
  ...saleNegotiationConditions,
  ...rentalNegotiationConditions,
] as const

export function isPropertyNegotiationCondition(
  value: string,
): value is PropertyNegotiationCondition {
  return propertyNegotiationConditions.some((condition) => condition === value)
}

export function conditionsForPurpose(
  purpose: 'RENT' | 'SALE' | 'BOTH',
  conditions: readonly PropertyNegotiationCondition[],
): PropertyNegotiationCondition[] {
  const allowed: readonly PropertyNegotiationCondition[] =
    purpose === 'BOTH'
      ? propertyNegotiationConditions
      : purpose === 'SALE'
        ? saleNegotiationConditions
        : rentalNegotiationConditions
  return [...new Set(conditions)].filter((condition) => allowed.includes(condition))
}

export function hasConflictingConditions(conditions: readonly PropertyNegotiationCondition[]) {
  return conditions.includes('CASH_ONLY') && conditions.includes('ACCEPTS_FINANCING')
}
