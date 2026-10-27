import { useQuery } from '@tanstack/react-query'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { tenantAgentsService } from '../services/tenant-agents-service'
import { useMarketplaceActorKey } from './use-marketplace-actor-key'

export function useTenantAgents() {
  const actorKey = useMarketplaceActorKey()

  return useQuery({
    queryKey: marketplaceQueryKeys.tenantAgents(actorKey),
    queryFn: () => tenantAgentsService.list(),
  })
}
