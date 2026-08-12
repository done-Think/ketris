import { useQuery } from '@tanstack/react-query'

import { tenantService } from '../services/tenant-service'

export function useTenantUsers(tenantId: string) {
  return useQuery({
    queryKey: ['platform', 'tenants', tenantId, 'users'],
    queryFn: () => tenantService.listUsers(tenantId),
    enabled: Boolean(tenantId),
  })
}
