import { useInfiniteQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { agendaService } from '../services/agenda-service'
import { agendaQueryKeys } from '../config/agenda-query-keys'

export function useAgendaProperties(search: string) {
  const { data: session } = useSession()
  const query = useInfiniteQuery({
    queryKey: agendaQueryKeys.properties(
      session?.tenantId,
      session?.user?.id,
      session?.role,
      search,
    ),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => agendaService.listProperties(search, pageParam),
    getNextPageParam: (page) =>
      page.page * page.pageSize < page.total ? page.page + 1 : undefined,
    enabled: Boolean(session?.tenantId && session?.user?.id && session?.role),
  })
  return { ...query, allowCustom: session?.role !== 'RENTER' }
}
