import { useMutation, useQueryClient } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'

export function useActivatePlatformAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => platformAdminService.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-admins'] }),
  })
}
