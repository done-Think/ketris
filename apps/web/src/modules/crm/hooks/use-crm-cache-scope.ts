import { useSession } from 'next-auth/react'

export function useCrmCacheScope(tenantId: string | null | undefined) {
  const { data: session, status } = useSession()
  return {
    actorKey: [session?.user?.id ?? '', session?.role ?? ''] as const,
    enabled:
      status === 'authenticated' &&
      Boolean(tenantId && session?.tenantId === tenantId && session?.user?.id && session?.role),
  }
}
