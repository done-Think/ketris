import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { platformQueryKeys } from '../config/platform-query-keys'
import { tenantService } from '../services/tenant-service'
import type {
  CreateTenantAdminInput,
  CreateTenantInput,
  TenantListQuery,
  UpdateTenantAccountPayload,
} from '../types/tenant'
import { usePlatformActor } from './use-platform-actor'

export function useTenantsPage(query: TenantListQuery) {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.tenantPage(actor.key, query),
    queryFn: () => tenantService.list(query),
    enabled: actor.enabled,
    placeholderData: keepPreviousData,
  })
}

export function useTenant(tenantId: string) {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.tenant(actor.key, tenantId),
    queryFn: () => tenantService.get(tenantId),
    enabled: actor.enabled && Boolean(tenantId),
  })
}

export function useTenantUsers(tenantId: string, page: number, pageSize: number) {
  const actor = usePlatformActor()

  return useQuery({
    queryKey: platformQueryKeys.tenantUsersPage(actor.key, tenantId, page, pageSize),
    queryFn: () => tenantService.listUsers(tenantId, page, pageSize),
    enabled: actor.enabled && Boolean(tenantId),
    placeholderData: keepPreviousData,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  const actor = usePlatformActor()

  return useMutation({
    mutationFn: (payload: CreateTenantInput) => tenantService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.all(actor.key) }),
  })
}

export function useCreateTenantAdmin() {
  const queryClient = useQueryClient()
  const actor = usePlatformActor()

  return useMutation({
    mutationFn: ({ tenantId, ...payload }: CreateTenantAdminInput) =>
      tenantService.createAdmin(tenantId, payload),
    onSuccess: (_user, variables) =>
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantUsers(actor.key, variables.tenantId),
      }),
  })
}

export function useUpdateTenantAccount() {
  const queryClient = useQueryClient()
  const actor = usePlatformActor()

  return useMutation({
    mutationFn: ({ tenantId, ...payload }: UpdateTenantAccountPayload & { tenantId: string }) =>
      tenantService.updateAccount(tenantId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.all(actor.key) }),
  })
}
