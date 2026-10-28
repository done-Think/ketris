import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  tenant: (tenantId: string | undefined) => [...maintenanceQueryKeys.all, tenantId] as const,
  lists: (tenantId: string | undefined) =>
    [...maintenanceQueryKeys.tenant(tenantId), 'list'] as const,
  list: (tenantId: string | undefined, filters: MaintenanceTicketListFilters = {}) =>
    [...maintenanceQueryKeys.lists(tenantId), normalizeFilters(filters)] as const,
  details: (tenantId: string | undefined) =>
    [...maintenanceQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string | undefined, ticketId: string) =>
    [...maintenanceQueryKeys.details(tenantId), ticketId] as const,
  activities: (tenantId: string | undefined, ticketId: string) =>
    [...maintenanceQueryKeys.detail(tenantId, ticketId), 'activities'] as const,
}

export function useMaintenanceTickets(filters: MaintenanceTicketListFilters = {}) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const session = scope.session
  return useQuery({
    queryKey: [...maintenanceQueryKeys.list(tenantId, filters), session?.user?.id, session?.role],
    queryFn: () => maintenanceService.list(filters),
    enabled: scope.enabled,
  })
}

export function useMaintenanceTicket(ticketId: string | null | undefined) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const session = scope.session
  const scopedTicketId = ticketId ?? ''

  return useQuery({
    queryKey: [
      ...maintenanceQueryKeys.detail(tenantId, scopedTicketId),
      session?.user?.id,
      session?.role,
    ],
    queryFn: () => maintenanceService.get(scopedTicketId),
    enabled: scope.enabled && Boolean(ticketId),
  })
}

export function useCreateMaintenanceTicket() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: MaintenanceCreateTicketFormValues) =>
      maintenanceService.create(buildCreateMaintenanceTicketPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(tenantId) })
    },
  })
}

export function useUpdateMaintenanceTicket() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: UpdateMaintenanceTicketVariables) =>
      maintenanceService.update(id, payload),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(tenantId, ticket.id),
      })
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(tenantId) })
    },
  })
}

export function useDeleteMaintenanceTicket() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => maintenanceService.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(tenantId) })
      queryClient.removeQueries({ queryKey: maintenanceQueryKeys.detail(tenantId, id) })
    },
  })
}

export function useResolveMaintenanceTicket(ticketId: string) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => maintenanceService.resolve(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(tenantId, ticketId),
      })
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists(tenantId) })
    },
  })
}

export function useAddMaintenanceTicketNote(ticketId: string) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) => maintenanceService.addNote(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(tenantId, ticketId),
      })
    },
  })
}

export function useUploadMaintenanceTicketAttachment(ticketId: string) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => maintenanceService.uploadAttachment(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: maintenanceQueryKeys.detail(tenantId, ticketId),
      })
    },
  })
}

export function useMaintenanceOptions() {
  const scope = useTenantSessionScope()
  const session = scope.session
  return useQuery({
    queryKey: ['maintenance-options', session?.tenantId, session?.user?.id, session?.role],
    queryFn: () => maintenanceService.options(),
    enabled: scope.enabled,
  })
}

export function useMaintenanceAction(ticketId: string) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: MaintenanceAction) => maintenanceService.act(ticketId, action),
    onSuccess: async (_ticket, action) => {
      await queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.tenant(tenantId) })
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
