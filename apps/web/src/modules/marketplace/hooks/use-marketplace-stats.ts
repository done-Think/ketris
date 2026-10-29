import { useQuery } from '@tanstack/react-query'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { marketplaceService } from '../services/marketplace-service'

export function useMarketplaceStats() {
  return useQuery({
    queryKey: marketplaceQueryKeys.stats(),
    queryFn: () => marketplaceService.getStats(),
    staleTime: 5 * 60_000,
  })
}
