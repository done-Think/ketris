import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { agendaService } from '../services/agenda-service'
import type {
  CreateAgendaEventPayload,
  AgendaEventMutationInput,
  CancelAgendaEventMutationInput,
  RescheduleAgendaEventPayload,
  UpdateAgendaEventPayload,
} from '../types/agenda-event'

export { agendaQueryKeys } from '../config/agenda-query-keys'
import { agendaQueryKeys } from '../config/agenda-query-keys'

export function useAgendaEvents(tenantId: string | null | undefined, from: string, to: string) {
  const { data: session } = useSession()
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: agendaQueryKeys.range(scopedTenantId, from, to, session?.user?.id, session?.role),
    queryFn: () => agendaService.list(from, to),
    enabled: Boolean(tenantId) && Boolean(session?.user?.id) && Boolean(session?.role),
  })
}

export function useCreateAgendaEvent(tenantId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAgendaEventPayload) => agendaService.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.tenant(tenantId) }),
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.notificationAll }),
      ])
    },
  })
}

export function useRescheduleAgendaEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: AgendaEventMutationInput<RescheduleAgendaEventPayload>) =>
      agendaService.reschedule(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.tenant(tenantId) }),
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.notificationAll }),
      ])
    },
  })
}

export function useUpdateAgendaEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: AgendaEventMutationInput<UpdateAgendaEventPayload>) =>
      agendaService.update(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.tenant(tenantId) }),
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.notificationAll }),
      ])
    },
  })
}

export function useCancelAgendaEvent(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: CancelAgendaEventMutationInput) =>
      agendaService.cancel(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.tenant(tenantId) }),
        queryClient.invalidateQueries({ queryKey: agendaQueryKeys.notificationAll }),
      ])
    },
  })
}
