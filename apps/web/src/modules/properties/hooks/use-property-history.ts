import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { propertyHistoryService } from '../services/property-history-service'

export function usePropertyHistory(id: string, page: number) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: [
      'properties',
      'history',
      id,
      session?.tenantId,
      session?.user?.id,
      session?.role,
      page,
    ],
    queryFn: ({ signal }) => propertyHistoryService.list(id, page, signal),
    enabled: Boolean(id && session?.tenantId && session.role !== 'RENTER'),
    retry: false,
  })
}
export function usePropertyHistoryEvent(id: string, eventId: string | null) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: [
      'properties',
      'history',
      id,
      session?.tenantId,
      session?.user?.id,
      session?.role,
      'event',
      eventId,
    ],
    queryFn: ({ signal }) => propertyHistoryService.get(id, eventId!, signal),
    placeholderData: undefined,
    enabled: Boolean(eventId && session?.tenantId && session.role !== 'RENTER'),
    retry: false,
  })
}
