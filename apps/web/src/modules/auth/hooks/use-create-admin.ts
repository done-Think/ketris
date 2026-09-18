import { useMutation } from '@tanstack/react-query'

import { adminService } from '../services/admin-service'

interface CreateAdminInput {
  name: string
  email: string
  password: string
}

export function useCreateAdmin() {
  return useMutation({
    mutationFn: (payload: CreateAdminInput) => adminService.create(payload),
  })
}
