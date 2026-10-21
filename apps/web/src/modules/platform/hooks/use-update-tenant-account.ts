import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantService } from '../services/tenant-service'
import type { UpdateTenantAccountPayload } from '../types/tenant'

export function useUpdateTenantAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, ...payload }: UpdateTenantAccountPayload & { tenantId: string }) =>
      tenantService.updateAccount(tenantId, payload),
    // Every platform screen that shows billing depends on the tenants' type and status.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform'] }),
  })
}
