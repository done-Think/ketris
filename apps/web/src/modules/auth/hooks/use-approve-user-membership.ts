import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authQueryKeys } from '../config/auth-query-keys'
import { useAuthQueryScope } from './use-auth-query-scope'

import { userService } from '../services/user-service'

export function useApproveUserMembership() {
  const queryClient = useQueryClient()
  const scope = useAuthQueryScope()

  return useMutation({
    mutationFn: (id: string) => userService.approveMembership(id),
    onMutate: () => scope,
    onSuccess: (_user, _id, originalScope) =>
      originalScope
        ? queryClient.invalidateQueries({ queryKey: authQueryKeys.users(originalScope) })
        : undefined,
  })
}
