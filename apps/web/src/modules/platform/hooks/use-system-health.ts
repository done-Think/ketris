import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { platformSystemService } from '../services/platform-system-service'

const REFRESH_INTERVAL_MS = 30_000

export function useSystemHealth() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['platform', 'system-health'],
    queryFn: () => platformSystemService.getHealth(),
    // Same as the other platform queries: only request once the session token is available.
    enabled: Boolean(session?.accessToken),
    refetchInterval: REFRESH_INTERVAL_MS,
  })
}
