import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { crmService } from '../services/crm-service'
import type {
  ConvertLeadPayload,
  CreateLeadPayload,
  LeadApiStage,
  LeadListFilters,
} from '../types/lead'
import { crmQueryKeys } from './use-opportunities'

export function useLeads(filters: LeadListFilters = {}) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useQuery({
    queryKey: crmQueryKeys.leadsList(tenantId, filters, scope.actorKey),
    queryFn: () => crmService.listLeads(filters),
    enabled: scope.enabled,
  })
}

export function useCreateLead() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => crmService.createLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadsTenant(tenantId) })
    },
  })
}

export function useUpdateLeadStage() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, stage }: { leadId: string; stage: LeadApiStage }) =>
      crmService.updateLeadStage(leadId, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadsTenant(tenantId) })
    },
  })
}

export function useConvertLeadToOpportunity() {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
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

export function useLead(leadId: string | null) {
  const scope = useTenantSessionScope()
  const tenantId = scope.tenantId
  return useQuery({
    queryKey: [...crmQueryKeys.leadsTenant(tenantId), 'detail', leadId, scope.actorKey],
    queryFn: () => crmService.getLead(leadId!),
    enabled: scope.enabled && Boolean(leadId),
  })
}
