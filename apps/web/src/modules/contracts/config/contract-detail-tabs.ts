import type { ContractDetailTab } from '../types/detail'

export const contractDetailTabs: readonly ContractDetailTab[] = [
  'summary',
  'payments',
  'documents',
  'tickets',
]

export function resolveContractDetailTab(
  value: string | null,
  available: readonly ContractDetailTab[],
): ContractDetailTab {
  return available.find((tab) => tab === value) ?? 'summary'
}
