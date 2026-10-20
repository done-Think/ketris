import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { platformAdminService } from '../services/platform-admin-service'

export function usePlatformAdmins() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['platform-admins'],
    queryFn: () => platformAdminService.list(),
    // Same as the other platform queries: only request once the session token is available.
    enabled: Boolean(session?.accessToken),
  })
}
