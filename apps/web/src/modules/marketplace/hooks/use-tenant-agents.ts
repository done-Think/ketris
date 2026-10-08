import { useQuery } from '@tanstack/react-query'

import { tenantAgentsService } from '../services/tenant-agents-service'

export function useTenantAgents() {
  return useQuery({
    queryKey: ['marketplace', 'tenant-agents'],
    queryFn: () => tenantAgentsService.list(),
  })
}
