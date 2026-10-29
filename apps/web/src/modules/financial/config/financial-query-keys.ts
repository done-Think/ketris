import type { ChargeListFilters } from '../types/service'

function normalizeFilters(filters: ChargeListFilters) {
  return {
    type: filters.type ?? null,
    status: filters.status ?? null,
    dueMonth: filters.dueMonth ?? null,
    search: filters.search ?? null,
    page: filters.page ?? null,
    pageSize: filters.pageSize ?? null,
  }
}

export const financialQueryKeys = {
  all: ['financial'] as const,
  tenant: (tenantId: string) => [...financialQueryKeys.all, tenantId] as const,
  charges: (tenantId: string) => [...financialQueryKeys.tenant(tenantId), 'charges'] as const,
  chargesList: (tenantId: string, actorKey: string, filters: ChargeListFilters) =>
    [...financialQueryKeys.charges(tenantId), 'list', actorKey, normalizeFilters(filters)] as const,
  chargeDetail: (tenantId: string, actorKey: string, chargeId: string) =>
    [...financialQueryKeys.charges(tenantId), 'detail', actorKey, chargeId] as const,
  chargeHistory: (tenantId: string, actorKey: string, chargeId: string) =>
    [...financialQueryKeys.charges(tenantId), 'history', actorKey, chargeId] as const,
  summary: (tenantId: string, actorKey: string, month: string | null) =>
    [...financialQueryKeys.tenant(tenantId), 'summary', actorKey, month] as const,
}
