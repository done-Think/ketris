import { BaseService } from '@shared/lib/api/base-service'

import type { AdminUser } from '../types/admin'

interface CreateAdminPayload {
  nome: string
  email: string
  password: string
}

interface UpdateAdminPayload {
  nome?: string
  email?: string
}

interface CreateAdminResponse {
  user: AdminUser
}

interface ListAdminsResponse {
  admins: AdminUser[]
}

interface GetAdminResponse {
  admin: AdminUser
}

interface UpdateAdminResponse {
  admin: AdminUser
}

interface DeactivateAdminResponse {
  admin: AdminUser
}

class AdminService extends BaseService {
  private readonly path = '/auth/admins'

  create(payload: CreateAdminPayload): Promise<AdminUser> {
    return this.http.post<CreateAdminResponse>(this.path, payload).then((data) => data.user)
  }

  list(): Promise<AdminUser[]> {
    return this.http.get<ListAdminsResponse>(this.path).then((data) => data.admins)
  }

  get(id: string): Promise<AdminUser> {
    return this.http.get<GetAdminResponse>(`${this.path}/${id}`).then((data) => data.admin)
  }

  update(id: string, payload: UpdateAdminPayload): Promise<AdminUser> {
    return this.http
      .patch<UpdateAdminResponse>(`${this.path}/${id}`, payload)
      .then((data) => data.admin)
  }

  deactivate(id: string): Promise<AdminUser> {
    return this.http
      .delete<DeactivateAdminResponse>(`${this.path}/${id}`)
      .then((data) => data.admin)
  }
}

export const adminService = new AdminService()
