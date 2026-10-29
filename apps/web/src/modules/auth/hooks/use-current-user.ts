import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { authQueryKeys } from '../config/auth-query-keys'
import { userService } from '../services/user-service'
import type { ChangeOwnPasswordPayload } from '../types/current-user-profile'
import type { UpdateCurrentUserPayload } from '../types/user'
import { useAuthQueryScope } from './use-auth-query-scope'

export function useCurrentUser() {
  const scope = useAuthQueryScope()
  return useQuery({
    queryKey: authQueryKeys.currentUser(scope),
    queryFn: () => userService.get(scope.userId!),
    enabled: Boolean(scope.tenantId && scope.userId && scope.role),
  })
}

export function useUpdateCurrentUser() {
  const scope = useAuthQueryScope()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCurrentUserPayload) => {
      if (!scope.userId || !scope.tenantId) throw new Error('AUTH_SCOPE_REQUIRED')
      return userService.update(scope.userId, payload)
    },
    onMutate: () => scope,
    onSuccess: (user, _payload, originalScope) => {
      if (!originalScope) return
      queryClient.setQueryData(authQueryKeys.currentUser(originalScope), user)
      return queryClient.invalidateQueries({ queryKey: authQueryKeys.users(originalScope) })
    },
  })
}

export function useUploadAvatar() {
  return useMutation({ mutationFn: (file: File) => userService.uploadAvatar(file) })
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (values: ChangeOwnPasswordPayload) =>
      userService.changeOwnPassword(values.currentPassword, values.password),
  })
}
