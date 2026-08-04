import { BaseService } from '@shared/lib/api/base-service'

import type { AdminUser } from '../types/admin'

interface CreateAdminPayload {
  nome: string
  email: string
  password: string
}

interface CreateAdminResponse {
  user: AdminUser
}

class AdminService extends BaseService {
  private readonly path = '/auth/admins'

  create(payload: CreateAdminPayload): Promise<AdminUser> {
    return this.http.post<CreateAdminResponse>(this.path, payload).then((data) => data.user)
  }
}

export const adminService = new AdminService()
