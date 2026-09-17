import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { crmService } from '../services/crm-service'
import type {
  CreateOpportunityPayload,
  OpportunityFilters,
  UpdateOpportunityInput,
} from '../types/opportunity'
import type { PublicPropertySearchFilters } from '../types/property'

function normalizeFilters(filters: OpportunityFilters) {
  return {
    status: filters.status ?? null,
    includeArchived: filters.includeArchived ?? false,
  }
}

function normalizePropertyFilters(filters: PublicPropertySearchFilters) {
  return {
    purpose: filters.purpose ?? null,
    propertyType: filters.propertyType ?? null,
    city: filters.city ?? null,
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
    minBedrooms: filters.minBedrooms ?? null,
    q: filters.q ?? null,
  }
}

export const crmQueryKeys = {
  all: ['crm'] as const,
  opportunities: () => [...crmQueryKeys.all, 'opportunities'] as const,
  tenant: (tenantId: string) => [...crmQueryKeys.opportunities(), tenantId] as const,
  lists: (tenantId: string) => [...crmQueryKeys.tenant(tenantId), 'list'] as const,
  list: (tenantId: string, filters: OpportunityFilters = {}) =>
    [...crmQueryKeys.lists(tenantId), normalizeFilters(filters)] as const,
  details: (tenantId: string) => [...crmQueryKeys.tenant(tenantId), 'detail'] as const,
  detail: (tenantId: string, opportunityId: string) =>
    [...crmQueryKeys.details(tenantId), opportunityId] as const,
  properties: () => [...crmQueryKeys.all, 'properties'] as const,
  propertyTenant: (tenantId: string) => [...crmQueryKeys.properties(), tenantId] as const,
  propertyLists: (tenantId: string) => [...crmQueryKeys.propertyTenant(tenantId), 'list'] as const,
  propertyList: (tenantId: string, filters: PublicPropertySearchFilters = {}) =>
    [...crmQueryKeys.propertyLists(tenantId), normalizePropertyFilters(filters)] as const,
  propertyDetails: (tenantId: string) =>
    [...crmQueryKeys.propertyTenant(tenantId), 'detail'] as const,
  propertyDetail: (tenantId: string, propertyId: string) =>
    [...crmQueryKeys.propertyDetails(tenantId), propertyId] as const,
}

export function useOpportunities(
  tenantId: string | null | undefined,
  filters: OpportunityFilters = {},
) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.list(scopedTenantId, filters),
    queryFn: () => crmService.list(filters),
    enabled: Boolean(tenantId),
  })
}

export function useOpportunity(
  tenantId: string | null | undefined,
  opportunityId: string | null | undefined,
) {
  const scopedTenantId = tenantId ?? ''
  const scopedOpportunityId = opportunityId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.detail(scopedTenantId, scopedOpportunityId),
    queryFn: () => crmService.getById(scopedOpportunityId),
    enabled: Boolean(tenantId && opportunityId),
  })
}

export function useCreateOpportunity(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateOpportunityPayload) => crmService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.lists(tenantId) })
    },
  })
}

export function useUpdateOpportunity(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, changes }: UpdateOpportunityInput) => crmService.update(id, changes),
    onSuccess: (opportunity) => {
      queryClient.setQueryData(crmQueryKeys.detail(tenantId, opportunity.id), opportunity)
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.lists(tenantId) })
    },
  })
}

export function useArchiveOpportunity(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (opportunityId: string) => crmService.archive(opportunityId),
    onSuccess: (opportunity) => {
      queryClient.setQueryData(crmQueryKeys.detail(tenantId, opportunity.id), opportunity)
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.lists(tenantId) })
    },
  })
}

export function useCrmProperties(
  tenantId: string | null | undefined,
  filters: PublicPropertySearchFilters = {},
) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.propertyList(scopedTenantId, filters),
    queryFn: () => crmService.listProperties(filters),
    enabled: Boolean(tenantId),
  })
}

export function useCrmProperty(
  tenantId: string | null | undefined,
  propertyId: string | null | undefined,
) {
  const scopedTenantId = tenantId ?? ''
  const scopedPropertyId = propertyId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.propertyDetail(scopedTenantId, scopedPropertyId),
    queryFn: () => crmService.getProperty(scopedPropertyId),
    enabled: Boolean(tenantId && propertyId),
  })
}
