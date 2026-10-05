import { BaseService } from '@shared/lib/api/base-service'

import type { PlatformAdminAccount, PlatformAdminRole } from '../types/platform-admin'

interface CreatePlatformAdminPayload {
  nome: string
  email: string
  password: string
  role: PlatformAdminRole
}

interface UpdatePlatformAdminPayload {
  nome: string
  email: string
  role: PlatformAdminRole
}

interface PlatformAdminResponse {
  admin: PlatformAdminAccount
}

interface ListPlatformAdminsResponse {
  admins: PlatformAdminAccount[]
}

class PlatformAdminService extends BaseService {
  private readonly path = '/platform/admins'

  create(payload: CreatePlatformAdminPayload): Promise<PlatformAdminAccount> {
    return this.http.post<PlatformAdminResponse>(this.path, payload).then((data) => data.admin)
  }

  list(): Promise<PlatformAdminAccount[]> {
    return this.http.get<ListPlatformAdminsResponse>(this.path).then((data) => data.admins)
  }

  deactivate(id: string): Promise<PlatformAdminAccount> {
    return this.http.delete<PlatformAdminResponse>(`${this.path}/${id}`).then((data) => data.admin)
  }

  activate(id: string): Promise<PlatformAdminAccount> {
    return this.http
      .patch<PlatformAdminResponse>(`${this.path}/${id}`, { ativo: true })
      .then((data) => data.admin)
  }

  update(id: string, payload: UpdatePlatformAdminPayload): Promise<PlatformAdminAccount> {
    return this.http
      .patch<PlatformAdminResponse>(`${this.path}/${id}`, payload)
      .then((data) => data.admin)
  }
}

export const platformAdminService = new PlatformAdminService()
