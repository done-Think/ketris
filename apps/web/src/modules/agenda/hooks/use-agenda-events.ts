import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { agendaService } from '../services/agenda-service'
import type { CreateAgendaEventPayload, RescheduleAgendaEventPayload } from '../types/agenda-event'

export const agendaQueryKeys = {
  all: ['agenda'] as const,
  events: () => [...agendaQueryKeys.all, 'events'] as const,
  tenant: (tenantId: string) => [...agendaQueryKeys.events(), tenantId] as const,
  range: (tenantId: string, from: string, to: string) =>
    [...agendaQueryKeys.tenant(tenantId), from, to] as const,
}

export function useAgendaEvents(tenantId: string | null | undefined, from: string, to: string) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: agendaQueryKeys.range(scopedTenantId, from, to),
    queryFn: () => agendaService.list(from, to),
    enabled: Boolean(tenantId),
  })
}

export function useCreateAgendaEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAgendaEventPayload) => agendaService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaQueryKeys.tenant(tenantId) })
    },
  })
}

export function useRescheduleAgendaEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleAgendaEventPayload }) =>
      agendaService.reschedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaQueryKeys.tenant(tenantId) })
    },
  })
}
