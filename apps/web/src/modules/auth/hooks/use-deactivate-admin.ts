import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminService } from '../services/admin-service'

export function useDeactivateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backoffice', 'admins'] })
    },
  })
}
