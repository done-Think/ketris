import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { tenantService } from '../services/tenant-service'

export function useTenantUsers(tenantId: string) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['platform', 'tenants', tenantId, 'users'],
    queryFn: () => tenantService.listUsers(tenantId),
    // Same as the other platform queries: wait for the session token, or a full page load
    // requests without it, gets a 401 and signs the platform admin out.
    enabled: Boolean(tenantId) && Boolean(session?.accessToken),
  })
}
