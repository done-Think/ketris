import { useQuery } from '@tanstack/react-query'

import { tenantService } from '../services/tenant-service'

export function useTenants() {
  return useQuery({
    queryKey: ['platform', 'tenants'],
    queryFn: () => tenantService.list(),
  })
}
