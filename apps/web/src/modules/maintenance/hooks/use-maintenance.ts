import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { maintenanceService } from '../services/maintenance-service'
import type { MaintenanceCreateTicketFormValues } from '../types/maintenance'
import type { MaintenanceTicketListFilters, UpdateMaintenanceTicketPayload } from '../types/service'
import { buildCreateMaintenanceTicketPayload } from '../utils/maintenance-adapter'

function normalizeFilters(filters: MaintenanceTicketListFilters) {
  return {
    status: filters.status ?? null,
    propertyId: filters.propertyId ?? null,
    search: filters.search ?? null,
    page: filters.page ?? null,
    pageSize: filters.pageSize ?? null,
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

  return useQuery({
    queryKey: maintenanceQueryKeys.list(scopedTenantId, filters),
    queryFn: () => maintenanceService.list(filters),
    enabled: Boolean(tenantId),
  })
}

export function useMaintenanceTicket(
  tenantId: string | null | undefined,
  ticketId: string | null | undefined,
) {
  const scopedTenantId = tenantId ?? ''
  const scopedTicketId = ticketId ?? ''

  return useQuery({
    queryKey: maintenanceQueryKeys.detail(scopedTenantId, scopedTicketId),
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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaintenanceTicketPayload }) =>
      maintenanceService.update(id, payload),
    onSuccess: (ticket) => {
      queryClient.setQueryData(maintenanceQueryKeys.detail(scopedTenantId, ticket.id), ticket)
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
    onSuccess: (ticket) => {
      queryClient.setQueryData(maintenanceQueryKeys.detail(scopedTenantId, ticketId), ticket)
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
