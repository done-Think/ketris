import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
  tenant: (tenantId: string | undefined) => [...crmQueryKeys.opportunities(), tenantId] as const,
  lists: (tenantId: string | undefined) => [...crmQueryKeys.tenant(tenantId), 'list'] as const,
  list: (
    tenantId: string | undefined,
    filters: OpportunityFilters = {},
    actorKey: readonly string[] = [],
  ) => [...crmQueryKeys.lists(tenantId), actorKey, normalizeFilters(filters)] as const,
  details: (tenantId: string | undefined) => [...crmQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string | undefined, opportunityId: string, actorKey: readonly string[] = []) =>
    [...crmQueryKeys.details(tenantId), opportunityId, actorKey] as const,
  properties: () => [...crmQueryKeys.all, 'properties'] as const,
  propertyTenant: (tenantId: string | undefined) =>
    [...crmQueryKeys.properties(), tenantId] as const,
  propertyLists: (tenantId: string | undefined) =>
    [...crmQueryKeys.propertyTenant(tenantId), 'list'] as const,
  propertyList: (
    tenantId: string | undefined,
    filters: CrmPropertySearchFilters = {},
    actorKey: readonly string[] = [],
  ) => [...crmQueryKeys.propertyLists(tenantId), actorKey, filters] as const,
  propertyDetails: (tenantId: string | undefined) =>
    [...crmQueryKeys.propertyTenant(tenantId), 'detail'] as const,
  propertyDetail: (
    tenantId: string | undefined,
    propertyId: string,
    actorKey: readonly string[] = [],
  ) => [...crmQueryKeys.propertyDetails(tenantId), propertyId, actorKey] as const,
  leads: () => [...crmQueryKeys.all, 'leads'] as const,
  leadsTenant: (tenantId: string | undefined) => [...crmQueryKeys.leads(), tenantId] as const,
  leadsList: (tenantId: string | undefined, filters = {}, actorKey: readonly string[] = []) =>
    [...crmQueryKeys.leadsTenant(tenantId), 'list', actorKey, filters] as const,
}

export function useOpportunities(filters: OpportunityFilters = {}) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useQuery({
    queryKey: crmQueryKeys.list(tenantId, filters, scope.actorKey),
    queryFn: () => crmService.list(filters),
    enabled: scope.enabled,
  })
}

export function useOpportunity(opportunityId: string | null | undefined) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const scopedOpportunityId = opportunityId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.detail(tenantId, scopedOpportunityId, scope.actorKey),
    queryFn: () => crmService.getById(scopedOpportunityId),
    enabled: scope.enabled && Boolean(opportunityId),
  })
}

export function useCreateOpportunity() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
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

export function useUpdateOpportunity() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: UpdateOpportunityInput) => crmService.update(id, changes),
    onMutate: () => ({ tenantId, actorKey: scope.actorKey }),
    onSuccess: (opportunity, _input, originalScope) => {
      if (!originalScope) return
      const { tenantId, actorKey } = originalScope
      queryClient.setQueryData(crmQueryKeys.detail(tenantId, opportunity.id, actorKey), opportunity)
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useArchiveOpportunity() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (opportunityId: string) => crmService.archive(opportunityId),
    onMutate: () => ({ tenantId, actorKey: scope.actorKey }),
    onSuccess: (opportunity, _input, originalScope) => {
      if (!originalScope) return
      const { tenantId, actorKey } = originalScope
      queryClient.setQueryData(crmQueryKeys.detail(tenantId, opportunity.id, actorKey), opportunity)
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

export function useCrmResponsibles(enabled: boolean) {
  const scope = useTenantSessionScope()
  const session = scope.session
  return useQuery({
    queryKey: [...crmQueryKeys.all, 'responsibles', session?.tenantId, scope.actorKey],
    queryFn: () => crmService.listResponsibles(),
    enabled: enabled && scope.enabled,
    staleTime: 60_000,
  })
}

export function useAssignOpportunityResponsible() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, responsibleId }: { id: string; responsibleId: string }) =>
      crmService.assignResponsible(id, responsibleId),
    onMutate: () => ({ tenantId, actorKey: scope.actorKey }),
    onSuccess: (opportunity, _input, originalScope) => {
      if (!originalScope) return
      const { tenantId, actorKey } = originalScope
      queryClient.setQueryData(crmQueryKeys.detail(tenantId, opportunity.id, actorKey), opportunity)
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) })
    },
  })
}

export function useCrmProperties(filters: CrmPropertySearchFilters = {}) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useInfiniteQuery({
    queryKey: crmQueryKeys.propertyList(tenantId, filters, scope.actorKey),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      crmService.listProperties({ ...filters, page: pageParam, pageSize: 10 }),
    getNextPageParam: (page) =>
      page.pagination.page < page.pagination.pageCount ? page.pagination.page + 1 : undefined,
    select: (data) => data.pages.flatMap((page) => page.properties),
    enabled: scope.enabled,
  })
}

export function useCrmAuthorizedProperty(propertyId: string | null | undefined) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const scopedPropertyId = propertyId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.propertyDetail(tenantId, scopedPropertyId, scope.actorKey),
    queryFn: () => crmService.getProperty(scopedPropertyId),
    enabled: scope.enabled && Boolean(propertyId),
  })
}

export function useOpportunityActivities(opportunityId: string) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useQuery({
    queryKey: [...crmQueryKeys.detail(tenantId, opportunityId, scope.actorKey), 'activities'],
    queryFn: () => crmService.listActivities(opportunityId),
    enabled: scope.enabled && Boolean(opportunityId),
  })
}

export function useRecordOpportunityActivity(opportunityId: string) {
  const scope = useTenantSessionScope()
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ description, type }: { description: string; type: 'NOTE' | 'CONTACT_MADE' }) =>
      crmService.addNote(opportunityId, description, type),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: crmQueryKeys.tenant(scope.tenantId) }),
        client.invalidateQueries({ queryKey: ['crm', 'contacts', scope.tenantId] }),
        client.invalidateQueries({ queryKey: ['team'] }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
      ]),
  })
}

export function useInfiniteOpportunities(filters: OpportunityFilters, enabled = true) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useInfiniteQuery({
    queryKey: [...crmQueryKeys.list(tenantId, filters, scope.actorKey), 'infinite'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => crmService.list({ ...filters, page: pageParam }),
    getNextPageParam: (page) =>
      page.pagination.page < page.pagination.pageCount ? page.pagination.page + 1 : undefined,
    enabled: scope.enabled && enabled,
  })
}

export function useCrmProperty(propertyId: string | null | undefined) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useQuery({
    queryKey: ['crm', 'published-property', tenantId, propertyId ?? '', scope.actorKey],
    queryFn: () => crmService.getPublishedProperty(propertyId!),
    enabled: scope.enabled && Boolean(propertyId),
  })
}
