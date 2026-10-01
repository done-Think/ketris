import { BaseService } from '@shared/lib/api/base-service'

import type {
  AdminUser,
  CreateAdminPayload,
  CreateAdminResponse,
  DeactivateAdminResponse,
  GetAdminResponse,
  ListAdminsResponse,
  UpdateAdminPayload,
  UpdateAdminResponse,
} from '../types/admin'

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
