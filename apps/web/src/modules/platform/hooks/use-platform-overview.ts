import { useQuery } from '@tanstack/react-query'

import { platformQueryKeys } from '../config/platform-query-keys'
import { platformOverviewService } from '../services/platform-overview-service'
import { platformSystemService } from '../services/platform-system-service'
import { usePlatformActor } from './use-platform-actor'

const systemHealthRefreshMs = 30_000

export function usePlatformOverview() {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.overview(actor.key),
    queryFn: () => platformOverviewService.get(),
    enabled: actor.enabled,
  })
}

export function useSystemHealth() {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.systemHealth(actor.key),
    queryFn: () => platformSystemService.getHealth(),
    enabled: actor.enabled,
    refetchInterval: systemHealthRefreshMs,
  })
}
