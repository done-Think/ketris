import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCrmCacheScope } from './use-crm-cache-scope'

import { crmService } from '../services/crm-service'
import type {
  ConvertLeadPayload,
  CreateLeadPayload,
  LeadApiStage,
  LeadListFilters,
} from '../types/lead'
import { crmQueryKeys } from './use-opportunities'

export function useLeads(tenantId: string | null | undefined, filters: LeadListFilters = {}) {
  const scope = useCrmCacheScope(tenantId)
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: crmQueryKeys.leadsList(scopedTenantId, filters, scope.actorKey),
    queryFn: () => crmService.listLeads(filters),
    enabled: scope.enabled,
  })
}

export function useCreateLead(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => crmService.createLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadsTenant(tenantId) })
    },
  })
}

export function useUpdateLeadStage(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, stage }: { leadId: string; stage: LeadApiStage }) =>
      crmService.updateLeadStage(leadId, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadsTenant(tenantId) })
    },
  })
}

export function useConvertLeadToOpportunity(tenantId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: ConvertLeadPayload }) =>
      crmService.convertLead(leadId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadsTenant(tenantId) })
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.lists(tenantId) })
    },
  })
}

export function useLead(tenantId: string, leadId: string | null) {
  const scope = useCrmCacheScope(tenantId)
  return useQuery({
    queryKey: [...crmQueryKeys.leadsTenant(tenantId), 'detail', leadId, scope.actorKey],
    queryFn: () => crmService.getLead(leadId!),
    enabled: scope.enabled && Boolean(leadId),
  })
}
