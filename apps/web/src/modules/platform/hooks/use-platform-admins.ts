import { useQuery } from '@tanstack/react-query'

import { platformAdminService } from '../services/platform-admin-service'

export function usePlatformAdmins() {
  return useQuery({
    queryKey: ['platform-admins'],
    queryFn: () => platformAdminService.list(),
  })
}
