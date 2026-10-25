import { useQuery } from '@tanstack/react-query'

import { authQueryKeys } from '../config/auth-query-keys'
import { useAuthQueryScope } from './use-auth-query-scope'

import { userService } from '../services/user-service'

export function useUsers(enabled = true) {
  const scope = useAuthQueryScope()
  return useQuery({
    queryKey: authQueryKeys.users(scope),
    queryFn: () => userService.list(true),
    enabled: enabled && Boolean(scope.tenantId && scope.userId && scope.role),
  })
}
