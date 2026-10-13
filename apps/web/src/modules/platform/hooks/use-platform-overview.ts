import { useQuery } from '@tanstack/react-query'

import { platformOverviewService } from '../services/platform-overview-service'

export function usePlatformOverview() {
  return useQuery({
    queryKey: ['platform', 'overview'],
    queryFn: () => platformOverviewService.get(),
  })
}
