import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { MaintenanceAction } from '../types/service'

import { maintenanceService } from '../services/maintenance-service'
import type { MaintenanceCreateTicketFormValues } from '../types/maintenance'
import type {
  MaintenanceTicketListFilters,
  UpdateMaintenanceTicketVariables,
} from '../types/service'
import { buildCreateMaintenanceTicketPayload } from '../utils/maintenance-adapter'
import { maintenanceProviderQueryKeys } from './use-maintenance-providers'

function normalizeFilters(filters: MaintenanceTicketListFilters) {
  return {
    status: filters.status ?? null,
    priority: filters.priority ?? null,
    category: filters.category ?? null,
    propertyId: filters.propertyId ?? null,
    search: filters.search ?? null,
    page: filters.page ?? null,
    pageSize: filters.pageSize ?? null,
    archived: filters.archived ?? false,
    locale: filters.locale ?? 'pt-BR',
  }
}

export const maintenanceQueryKeys = {
  all: ['maintenance'] as const,
  tenant: (tenantId: string) => [...maintenanceQueryKeys.all, tenantId] as const,
  lists: (tenantId: string) => [...maintenanceQueryKeys.tenant(tenantId), 'list'] as const,
  list: (tenantId: string, filters: MaintenanceTicketListFilters = {}) =>
    [...maintenanceQueryKeys.lists(tenantId), normalizeFilters(filters)] as const,
  details: (tenantId: string) => [...maintenanceQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string, ticketId: string) =>
    [...maintenanceQueryKeys.details(tenantId), ticketId] as const,
  activities: (tenantId: string, ticketId: string) =>
    [...maintenanceQueryKeys.detail(tenantId, ticketId), 'activities'] as const,
}

export function useMaintenanceTickets(
  tenantId: string | null | undefined,
  filters: MaintenanceTicketListFilters = {},
) {
  const scopedTenantId = tenantId ?? ''
  const { data: session } = useSession()

  return useQuery({
    queryKey: [
      ...maintenanceQueryKeys.list(scopedTenantId, filters),
      session?.user?.id,
      session?.role,
    ],
    queryFn: () => maintenanceService.list(filters),
    enabled: Boolean(tenantId),
  })
}

export function useMaintenanceTicket(
  tenantId: string | null | undefined,
  ticketId: string | null | undefined,
) {
  const scopedTenantId = tenantId ?? ''
  const { data: session } = useSession()
  const scopedTicketId = ticketId ?? ''

  return useQuery({
    queryKey: [
      ...maintenanceQueryKeys.detail(scopedTenantId, scopedTicketId),
      session?.user?.id,
      session?.role,
    ],
    queryFn: () => maintenanceService.get(scopedTicketId),
    enabled: Boolean(tenantId) && Boolean(ticketId),
  })
}

export function useCreateMaintenanceTicket(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (values: MaintenanceCreateTicketFormValues) =>
      maintenanceService.create(buildCreateMaintenanceTicketPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(scopedTenantId) })
    },
  })
}

export function useUpdateMaintenanceTicket(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: ({ id, payload }: UpdateMaintenanceTicketVariables) =>
      maintenanceService.update(id, payload),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(scopedTenantId, ticket.id),
      })
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(scopedTenantId) })
    },
  })
}

export function useDeleteMaintenanceTicket(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (id: string) => maintenanceService.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(scopedTenantId) })
      queryClient.removeQueries({ queryKey: maintenanceQueryKeys.detail(scopedTenantId, id) })
    },
  })
}

export function useResolveMaintenanceTicket(tenantId: string | null | undefined, ticketId: string) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: () => maintenanceService.resolve(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(scopedTenantId, ticketId),
      })
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(scopedTenantId) })
    },
  })
}

export function useAddMaintenanceTicketNote(tenantId: string | null | undefined, ticketId: string) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (message: string) => maintenanceService.addNote(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(scopedTenantId, ticketId),
      })
    },
  })
}

export function useUploadMaintenanceTicketAttachment(
  tenantId: string | null | undefined,
  ticketId: string,
) {
  const queryClient = useQueryClient()
  const scopedTenantId = tenantId ?? ''

  return useMutation({
    mutationFn: (file: File) => maintenanceService.uploadAttachment(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(scopedTenantId, ticketId),
      })
    },
  })
}

export function useMaintenanceOptions() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: ['maintenance-options', session?.tenantId, session?.user?.id, session?.role],
    queryFn: () => maintenanceService.options(),
    enabled: Boolean(session?.tenantId),
  })
}

export function useMaintenanceAction(tenantId: string | undefined, ticketId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: MaintenanceAction) => maintenanceService.act(ticketId, action),
    onSuccess: async (_ticket, action) => {
      await queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.tenant(tenantId ?? '') })
      if (action.action === 'provider' || action.action === 'approveReplacement') {
        await queryClient.invalidateQueries({ queryKey: maintenanceProviderQueryKeys.all })
      }
    },
  })
}

export function useRegularizeMaintenanceLinks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: import('../types/service').MaintenanceUserLinkInput) =>
      maintenanceService.linkUsers(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance-options'] })
      await queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.all })
    },
  })
}
