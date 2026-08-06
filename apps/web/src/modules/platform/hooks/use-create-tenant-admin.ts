import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tenantService } from '../services/tenant-service'

interface CreateTenantAdminInput {
  tenantId: string
  nome: string
  email: string
  password: string
}

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
