import type { TenantStatus } from '../types/tenant'

export const tenantStatusChipColor: Record<
  TenantStatus,
  'success' | 'warning' | 'error' | 'default'
> = {
  ACTIVE: 'success',
  TRIAL: 'warning',
  SUSPENDED: 'error',
  CANCELED: 'default',
}
