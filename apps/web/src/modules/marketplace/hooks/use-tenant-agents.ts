import { useQuery } from '@tanstack/react-query'

import { listTenantAgents } from '../services/tenant-agents-service'

export function useTenantAgents() {
  return useQuery({
    queryKey: ['marketplace', 'tenant-agents'],
    queryFn: () => listTenantAgents(),
  })
}
