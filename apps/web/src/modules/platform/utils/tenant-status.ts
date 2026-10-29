import { TENANT_ACCOUNT_TYPES, type TenantStatus, type TenantTypeFilter } from '../types/tenant'

export const tenantStatusChipColor: Record<
  TenantStatus,
  'success' | 'warning' | 'error' | 'default'
> = {
  ACTIVE: 'success',
  TRIAL: 'warning',
  SUSPENDED: 'error',
  CANCELED: 'default',
}

export function toTenantTypeFilter(value: string): TenantTypeFilter {
  return TENANT_ACCOUNT_TYPES.find((type) => type === value) ?? 'ALL'
}
