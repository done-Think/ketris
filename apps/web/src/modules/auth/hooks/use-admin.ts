import { useQuery } from '@tanstack/react-query'

import { adminService } from '../services/admin-service'

export function useAdmin(id: string) {
  return useQuery({
    queryKey: ['backoffice', 'admins', id],
    queryFn: () => adminService.get(id),
    enabled: Boolean(id),
  })
}
