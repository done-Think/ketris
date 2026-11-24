import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { contactLinkService } from '../services/contact-link-service'
import type { LinkContactPayload } from '../types/contact-link'
import { invalidateContactHistory } from './use-interactions'

export function useContactLink(leadId: string) {
  const scope = useTenantSessionScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LinkContactPayload) => contactLinkService.link(leadId, payload),
    onSuccess: () => invalidateContactHistory(queryClient, scope.tenantId),
  })
}
