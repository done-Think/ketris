import { useQuery } from '@tanstack/react-query'

import { userService } from '../services/user-service'

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'users'],
    queryFn: () => userService.list(),
    enabled,
  })
}
