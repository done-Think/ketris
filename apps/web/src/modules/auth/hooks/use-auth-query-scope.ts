import { useSession } from 'next-auth/react'

import type { AuthQueryScope } from '../types/query'

export function useAuthQueryScope(): AuthQueryScope {
  const { data: session } = useSession()
  return {
    tenantId: session?.tenantId,
    userId: session?.user?.id,
    role: session?.role,
  }
}
