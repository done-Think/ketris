'use client'

import { useSession } from 'next-auth/react'

export function useTenantSessionScope() {
  const { data: session, status } = useSession()
  const tenantId = session?.tenantId
  const userId = session?.user?.id
  const role = session?.role

  return {
    session,
    tenantId,
    userId,
    role,
    actorKey: userId && role ? ([userId, role] as const) : [],
    enabled:
      status !== 'loading' && status !== 'unauthenticated' && Boolean(tenantId && userId && role),
  }
}
