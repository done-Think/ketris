import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { platformOverviewService } from '../services/platform-overview-service'

export function usePlatformOverview() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['platform', 'overview'],
    queryFn: () => platformOverviewService.get(),
    // Same as useTenants: only request once the session (and its token) is available.
    enabled: Boolean(session?.accessToken),
  })
}
