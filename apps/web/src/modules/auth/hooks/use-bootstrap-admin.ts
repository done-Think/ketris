import { useMutation } from '@tanstack/react-query'

import { adminService } from '../services/admin-service'

interface BootstrapAdminInput {
  tenantSlug: string
  nome: string
  email: string
  password: string
}

export function useBootstrapAdmin() {
  return useMutation({
    mutationFn: (payload: BootstrapAdminInput) => adminService.bootstrap(payload),
  })
}
