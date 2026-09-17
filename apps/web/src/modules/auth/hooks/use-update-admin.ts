import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminService } from '../services/admin-service'

interface UpdateAdminInput {
  id: string
  nome?: string
  email?: string
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAdminInput) => adminService.update(id, payload),
    onSuccess: (_admin, variables) => {
      queryClient.invalidateQueries({ queryKey: ['backoffice', 'admins'] })
      queryClient.invalidateQueries({ queryKey: ['backoffice', 'admins', variables.id] })
    },
  })
}
