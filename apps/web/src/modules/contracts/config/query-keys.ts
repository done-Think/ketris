import type { ContractListFilters } from '../types/service'

export const contractsQueryKeys = {
  all: ['contracts'] as const,
  tenant: (tenantId: string | undefined | undefined) => ['contracts', tenantId] as const,
  actor: (tenantId: string | undefined | undefined, userId?: string, role?: string) =>
    ['contracts', tenantId, userId ?? null, role ?? null] as const,
  list: (
    tenantId: string | undefined | undefined,
    userId: string | undefined,
    role: string | undefined,
    filters: ContractListFilters,
  ) => [...contractsQueryKeys.actor(tenantId, userId, role), 'list', filters] as const,
  detail: (
    tenantId: string | undefined | undefined,
    userId: string | undefined,
    role: string | undefined,
    contractId: string,
  ) => [...contractsQueryKeys.actor(tenantId, userId, role), 'detail', contractId] as const,
}
