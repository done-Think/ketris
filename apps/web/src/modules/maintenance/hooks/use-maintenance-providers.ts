import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { maintenanceService } from '../services/maintenance-service'
import type {
  CreateMaintenanceProviderPayload,
  MaintenanceProviderFilters,
  UpdateMaintenanceProviderPayload,
} from '../types/maintenance-provider'

export const maintenanceProviderQueryKeys = {
  all: ['maintenance-providers'] as const,
}

export function useMaintenanceProviders(filters: MaintenanceProviderFilters, enabled = true) {
  const { data: session, status } = useSession()
  return useQuery({
    queryKey: [
      ...maintenanceProviderQueryKeys.all,
      session?.tenantId,
      session?.user?.id,
      session?.role,
      filters,
    ],
    queryFn: () => maintenanceService.listProviders(filters),
    enabled:
      enabled && status === 'authenticated' && Boolean(session?.tenantId && session?.user?.id),
  })
}

export function useMaintenanceProviderOptions(ticketId: string, search: string) {
  const { data: session, status } = useSession()
  return useInfiniteQuery({
    queryKey: [
      ...maintenanceProviderQueryKeys.all,
      session?.tenantId,
      session?.user?.id,
      session?.role,
      'options',
      ticketId,
      search,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      maintenanceService.listProviders({
        ticketId,
        search: search.trim() || undefined,
        page: pageParam,
        pageSize: 5,
      }),
    getNextPageParam: (page) =>
      page.page * page.pageSize < page.totalCount ? page.page + 1 : undefined,
    enabled: status === 'authenticated' && Boolean(session?.user?.id && ticketId),
  })
}

export function useCreateMaintenanceProvider() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMaintenanceProviderPayload) =>
      maintenanceService.createProvider(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: maintenanceProviderQueryKeys.all }),
  })
}

export function useUpdateMaintenanceProvider() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaintenanceProviderPayload }) =>
      maintenanceService.updateProvider(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: maintenanceProviderQueryKeys.all }),
  })
}
