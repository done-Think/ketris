import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantService } from '../services/tenant-service'
import type { CreateTenantAdminInput } from '../types/tenant'

export function useCreateTenantAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, ...payload }: CreateTenantAdminInput) =>
      tenantService.createAdmin(tenantId, payload),
    onSuccess: (_user, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['platform', 'tenants', variables.tenantId, 'users'],
      })
    },
  })
}
