import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { interactionService } from '../services/interaction-service'
import type {
  CompleteInteractionPayload,
  InteractionTarget,
  StartInteractionPayload,
} from '../types/interaction'
import { crmContactQueryKeys } from './use-contacts'
import { crmQueryKeys } from './use-opportunities'

export function invalidateContactHistory(queryClient: QueryClient, tenantId: string | undefined) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: crmQueryKeys.interactionsTenant(tenantId) }),
    queryClient.invalidateQueries({ queryKey: crmQueryKeys.leadsTenant(tenantId) }),
    queryClient.invalidateQueries({ queryKey: crmQueryKeys.tenant(tenantId) }),
    queryClient.invalidateQueries({ queryKey: crmContactQueryKeys.tenant(tenantId) }),
  ])
}

export function useInteractions(target: InteractionTarget, page: number) {
  const scope = useTenantSessionScope()
  return useQuery({
    queryKey: crmQueryKeys.interactionsList(scope.tenantId, target, page, scope.actorKey),
    queryFn: () => interactionService.list(target, page),
    enabled: scope.enabled && Boolean(target.id),
  })
}

export function useStartInteraction(leadId: string | null) {
  const scope = useTenantSessionScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StartInteractionPayload) => {
      if (!leadId) throw new Error('Missing lead identifier.')
      return interactionService.start(leadId, payload)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.interactionsTenant(scope.tenantId) }),
  })
}

export function useCompleteInteraction(id: string) {
  const scope = useTenantSessionScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CompleteInteractionPayload) => interactionService.complete(id, payload),
    onSuccess: () => invalidateContactHistory(queryClient, scope.tenantId),
  })
}

export function useStartContactInteraction() {
  const scope = useTenantSessionScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId, payload }: { contactId: string; payload: StartInteractionPayload }) =>
      interactionService.startContact(contactId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.interactionsTenant(scope.tenantId) }),
  })
}
