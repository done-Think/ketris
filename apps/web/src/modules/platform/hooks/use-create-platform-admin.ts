import { useMutation } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'

interface CreatePlatformAdminInput {
  nome: string
  email: string
  password: string
}

export function useCreatePlatformAdmin() {
  return useMutation({
    mutationFn: (payload: CreatePlatformAdminInput) => platformAdminService.create(payload),
  })
}
