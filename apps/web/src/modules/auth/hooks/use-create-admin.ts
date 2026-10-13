import { useMutation } from '@tanstack/react-query'

import { adminService } from '../services/admin-service'
import type { CreateAdminInput } from '../types/admin'

export function useCreateAdmin() {
  return useMutation({
    mutationFn: (payload: CreateAdminInput) => adminService.create(payload),
  })
}
