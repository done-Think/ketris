import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { agendaService } from '../services/agenda-service'

export function useAgendaAgents(enabled: boolean) {
  const { data: session } = useSession()
  return useQuery({
    queryKey: ['agenda', 'agents', session?.tenantId, session?.user?.id, session?.papel],
    queryFn: () => agendaService.listAgents(),
    enabled:
      enabled && Boolean(session?.tenantId && session?.user?.id && session?.papel === 'ADMIN'),
    staleTime: 0,
  })
}
