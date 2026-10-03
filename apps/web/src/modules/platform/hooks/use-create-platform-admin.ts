import { useMutation } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'
import type { CreatePlatformAdminInput } from '../types/platform-admin'

export function useCreatePlatformAdmin() {
  return useMutation({
    mutationFn: (payload: CreatePlatformAdminInput) => platformAdminService.create(payload),
  })
}
