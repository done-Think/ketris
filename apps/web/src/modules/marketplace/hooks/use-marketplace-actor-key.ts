import { useSession } from 'next-auth/react'

export function useMarketplaceActorKey(): string {
  const { data: session } = useSession()

  return `${session?.tenantId ?? ''}:${session?.user?.id ?? ''}:${session?.role ?? ''}`
}
