import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authQueryKeys } from '../config/auth-query-keys'
import { useAuthQueryScope } from './use-auth-query-scope'

import { userService } from '../services/user-service'
import type { CreateTenantUserPayload } from '../types/user'

export function useCreateUser() {
  const queryClient = useQueryClient()
  const scope = useAuthQueryScope()

  return useMutation({
    mutationFn: (payload: CreateTenantUserPayload) => userService.create(payload),
    onMutate: () => scope,
    onSuccess: (_user, _payload, originalScope) =>
      originalScope
        ? queryClient.invalidateQueries({ queryKey: authQueryKeys.users(originalScope) })
        : undefined,
  })
}
