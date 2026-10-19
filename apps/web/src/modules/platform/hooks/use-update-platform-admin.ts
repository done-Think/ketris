import { useMutation, useQueryClient } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'
import type { UpdatePlatformAdminInput } from '../types/platform-admin'

export function useUpdatePlatformAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePlatformAdminInput) =>
      platformAdminService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-admins'] }),
  })
}
