import { useMutation, useQueryClient } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'
import type { PlatformAdminRole } from '../types/platform-admin'

interface CreatePlatformAdminInput {
  nome: string
  email: string
  password: string
  role: PlatformAdminRole
}

export function useCreatePlatformAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePlatformAdminInput) => platformAdminService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-admins'] }),
  })
}
