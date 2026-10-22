import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { agendaService } from '../services/agenda-service'

export function useAgendaOrganization() {
  const { data: session } = useSession()
  const scope = [session?.tenantId, session?.user?.id, session?.role]
  const enabled = Boolean(session?.tenantId && session?.user?.id)
  const isRenter = session?.role === 'RENTER'
  const charges = useQuery({
    queryKey: ['agenda', 'charges', ...scope],
    queryFn: () => agendaService.listCharges(),
    enabled: enabled && isRenter,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const maintenance = useQuery({
    queryKey: ['agenda', 'maintenance', ...scope],
    queryFn: () => agendaService.listMaintenance(),
    enabled: enabled && (isRenter || session?.role === 'ADMIN'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  return { charges, maintenance }
}
