import { useQuery } from '@tanstack/react-query'

import { adminService } from '../services/admin-service'

export function useAdmins() {
  return useQuery({
    queryKey: ['backoffice', 'admins'],
    queryFn: () => adminService.list(),
  })
}
