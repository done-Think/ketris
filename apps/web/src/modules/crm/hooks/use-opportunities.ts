import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { useCrmCacheScope } from './use-crm-cache-scope'

import { crmService } from '../services/crm-service'
import type {
  CreateOpportunityPayload,
  OpportunityFilters,
  UpdateOpportunityInput,
} from '../types/opportunity'
import type { CrmPropertySearchFilters } from '../types/property'

function normalizeFilters(filters: OpportunityFilters) {
  return {
    ...filters,
    status: filters.status ?? null,
    includeArchived: filters.includeArchived ?? false,
  }
}

export const crmQueryKeys = {
  all: ['crm'] as const,
  opportunities: () => [...crmQueryKeys.all, 'opportunities'] as const,
  tenant: (tenantId: string) => [...crmQueryKeys.opportunities(), tenantId] as const,
  lists: (tenantId: string) => [...crmQueryKeys.tenant(tenantId), 'list'] as const,
  list: (tenantId: string, filters: OpportunityFilters = {}, actorKey: readonly string[] = []) =>
    [...crmQueryKeys.lists(tenantId), actorKey, normalizeFilters(filters)] as const,
  details: (tenantId: string) => [...crmQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string, opportunityId: string, actorKey: readonly string[] = []) =>
    [...crmQueryKeys.details(tenantId), opportunityId, actorKey] as const,
  properties: () => [...crmQueryKeys.all, 'properties'] as const,
  propertyTenant: (tenantId: string) => [...crmQueryKeys.properties(), tenantId] as const,
  propertyLists: (tenantId: string) => [...crmQueryKeys.propertyTenant(tenantId), 'list'] as const,
  propertyList: (
    tenantId: string,
    filters: CrmPropertySearchFilters = {},
    actorKey: readonly string[] = [],
  ) => [...crmQueryKeys.propertyLists(tenantId), actorKey, filters] as const,
  propertyDetails: (tenantId: string) =>
    [...crmQueryKeys.propertyTenant(tenantId), 'detail'] as const,
  propertyDetail: (tenantId: string, propertyId: string, actorKey: readonly string[] = []) =>
    [...crmQueryKeys.propertyDetails(tenantId), propertyId, actorKey] as const,
  leads: () => [...crmQueryKeys.all, 'leads'] as const,
  leadsTenant: (tenantId: string) => [...crmQueryKeys.leads(), tenantId] as const,
  leadsList: (tenantId: string, filters = {}, actorKey: readonly string[] = []) =>
    [...crmQueryKeys.leadsTenant(tenantId), 'list', actorKey, filters] as const,
}

export function useOpportunities(
  tenantId: string | null | undefined,
  filters: OpportunityFilters = {},
) {
  const scope = useCrmCacheScope(tenantId)
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.list(scopedTenantId, filters, scope.actorKey),
    queryFn: () => crmService.list(filters),
    enabled: scope.enabled,
  })
}

export function useOpportunity(
  tenantId: string | null | undefined,
  opportunityId: string | null | undefined,
) {
  const scope = useCrmCacheScope(tenantId)
  const scopedTenantId = tenantId ?? ''
  const scopedOpportunityId = opportunityId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.detail(scopedTenantId, scopedOpportunityId, scope.actorKey),
    queryFn: () => crmService.getById(scopedOpportunityId),
    enabled: scope.enabled && Boolean(opportunityId),
  })
}

export function useCreateOpportunity(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOpportunityPayload) => crmService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useUpdateOpportunity(tenantId: string) {
  const scope = useCrmCacheScope(tenantId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: UpdateOpportunityInput) => crmService.update(id, changes),
    onSuccess: (opportunity) => {
      queryClient.setQueryData(
        crmQueryKeys.detail(tenantId, opportunity.id, scope.actorKey),
        opportunity,
      )
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useArchiveOpportunity(tenantId: string) {
  const scope = useCrmCacheScope(tenantId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (opportunityId: string) => crmService.archive(opportunityId),
    onSuccess: (opportunity) => {
      queryClient.setQueryData(
        crmQueryKeys.detail(tenantId, opportunity.id, scope.actorKey),
        opportunity,
      )
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useCrmResponsibles(enabled: boolean) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: [
      ...crmQueryKeys.all,
      'responsibles',
      session?.tenantId ?? '',
      session?.user?.id ?? '',
    ],
    queryFn: () => crmService.listResponsibles(),
    enabled: enabled && Boolean(session?.tenantId),
    staleTime: 60_000,
  })
}

export function useAssignOpportunityResponsible(tenantId: string) {
  const scope = useCrmCacheScope(tenantId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, responsibleId }: { id: string; responsibleId: string }) =>
      crmService.assignResponsible(id, responsibleId),
    onSuccess: (opportunity) => {
      queryClient.setQueryData(
        crmQueryKeys.detail(tenantId, opportunity.id, scope.actorKey),
        opportunity,
      )
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
    },
  })
}

export function useCrmProperties(
  tenantId: string | null | undefined,
  filters: CrmPropertySearchFilters = {},
) {
  const scope = useCrmCacheScope(tenantId)
  return useInfiniteQuery({
    queryKey: crmQueryKeys.propertyList(tenantId ?? '', filters, scope.actorKey),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      crmService.listProperties({ ...filters, page: pageParam, pageSize: 10 }),
    getNextPageParam: (page) =>
      page.pagination.page < page.pagination.pageCount ? page.pagination.page + 1 : undefined,
    select: (data) => data.pages.flatMap((page) => page.properties),
    enabled: scope.enabled,
  })
}

export function useCrmAuthorizedProperty(
  tenantId: string | null | undefined,
  propertyId: string | null | undefined,
) {
  const scope = useCrmCacheScope(tenantId)
  const scopedTenantId = tenantId ?? ''
  const scopedPropertyId = propertyId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.propertyDetail(scopedTenantId, scopedPropertyId, scope.actorKey),
    queryFn: () => crmService.getProperty(scopedPropertyId),
    enabled: scope.enabled && Boolean(propertyId),
  })
}

export function useOpportunityActivities(
  tenantId: string | null | undefined,
  opportunityId: string,
) {
  const scope = useCrmCacheScope(tenantId)
  return useQuery({
    queryKey: [...crmQueryKeys.detail(tenantId ?? '', opportunityId, scope.actorKey), 'activities'],
    queryFn: () => crmService.listActivities(opportunityId),
    enabled: scope.enabled && Boolean(opportunityId),
  })
}

export function useInfiniteOpportunities(
  tenantId: string,
  filters: OpportunityFilters,
  enabled = true,
) {
  const scope = useCrmCacheScope(tenantId)
  return useInfiniteQuery({
    queryKey: [...crmQueryKeys.list(tenantId, filters, scope.actorKey), 'infinite'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => crmService.list({ ...filters, page: pageParam }),
    getNextPageParam: (page) =>
      page.pagination.page < page.pagination.pageCount ? page.pagination.page + 1 : undefined,
    enabled: scope.enabled && enabled,
  })
}

export function useCrmProperty(
  tenantId: string | null | undefined,
  propertyId: string | null | undefined,
) {
  const scope = useCrmCacheScope(tenantId)
  return useQuery({
    queryKey: ['crm', 'published-property', tenantId ?? '', propertyId ?? '', scope.actorKey],
    queryFn: () => crmService.getPublishedProperty(propertyId!),
    enabled: scope.enabled && Boolean(propertyId),
  })
}
