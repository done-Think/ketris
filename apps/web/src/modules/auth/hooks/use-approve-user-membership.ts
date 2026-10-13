import { useMutation, useQueryClient } from '@tanstack/react-query'

import { userService } from '../services/user-service'

export function useApproveUserMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => userService.approveMembership(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backoffice', 'users'] })
    },
  })
}
