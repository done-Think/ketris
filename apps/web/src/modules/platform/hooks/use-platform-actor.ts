import { useSession } from 'next-auth/react'

export function usePlatformActor() {
  const { data: session } = useSession()
  const role = session?.scope === 'platform' ? session.platformRole : undefined

  return {
    key: `${session?.user?.id ?? ''}:${role ?? ''}`,
    enabled: Boolean(session?.accessToken) && session?.scope === 'platform',
    canManage: role === 'ADMIN',
  }
}
