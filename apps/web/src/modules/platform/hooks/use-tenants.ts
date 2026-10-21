import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { tenantService } from '../services/tenant-service'

export function useTenants() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['platform', 'tenants'],
    queryFn: () => tenantService.list(),
    // Wait for the session so the request carries the token; on a full page load the query would
    // otherwise run first, get a 401 and sign the platform admin out.
    enabled: Boolean(session?.accessToken),
  })
}
