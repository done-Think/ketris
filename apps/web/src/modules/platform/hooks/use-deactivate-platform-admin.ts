import { useMutation, useQueryClient } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'

export function useDeactivatePlatformAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => platformAdminService.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-admins'] }),
  })
}
