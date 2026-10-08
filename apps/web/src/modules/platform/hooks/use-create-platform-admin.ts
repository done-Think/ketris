import { useMutation, useQueryClient } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'
import type { CreatePlatformAdminInput } from '../types/platform-admin'

export function useCreatePlatformAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePlatformAdminInput) => platformAdminService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-admins'] }),
  })
}
