import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantService } from '../services/tenant-service'

interface CreateTenantInput {
  nome: string
  slug: string
}

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTenantInput) => tenantService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] })
    },
  })
}
