import { agendaQueryKeys } from '../config/agenda-query-keys'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { agendaService } from '../services/agenda-service'

export function useAgendaOrganization() {
  const { data: session } = useSession()
  const enabled = Boolean(session?.tenantId && session?.user?.id)
  const isRenter = session?.role === 'RENTER'
  const charges = useQuery({
    queryKey: agendaQueryKeys.organization(
      'charges',
      session?.tenantId,
      session?.user?.id,
      session?.role,
    ),
    queryFn: () => agendaService.listCharges(),
    enabled: enabled && isRenter,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const maintenance = useQuery({
    queryKey: agendaQueryKeys.organization(
      'maintenance',
      session?.tenantId,
      session?.user?.id,
      session?.role,
    ),
    queryFn: () => agendaService.listMaintenance(),
    enabled: enabled && (isRenter || session?.role === 'OWNER'),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  return { charges, maintenance }
}
