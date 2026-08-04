import { useMutation } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'

interface BootstrapPlatformAdminInput {
  nome: string
  email: string
  password: string
}

export function useBootstrapPlatformAdmin() {
  return useMutation({
    mutationFn: (payload: BootstrapPlatformAdminInput) => platformAdminService.bootstrap(payload),
  })
}
