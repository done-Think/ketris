import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '../services/user-service'
import type { CreateTenantUserPayload } from '../types/user'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTenantUserPayload) => userService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backoffice', 'users'] }),
  })
}
