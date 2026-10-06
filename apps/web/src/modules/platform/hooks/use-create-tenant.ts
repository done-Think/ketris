import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantService } from '../services/tenant-service'
import type { CreateTenantInput } from '../types/tenant'

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTenantInput) => tenantService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] })
    },
  })
}
