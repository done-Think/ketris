import { BaseService } from '@shared/lib/api/base-service'

import type { PlatformAdminAccount } from '../types/platform-admin'

interface BootstrapPlatformAdminPayload {
  nome: string
  email: string
  password: string
}

interface CreatePlatformAdminPayload {
  nome: string
  email: string
  password: string
}

interface PlatformAdminResponse {
  admin: PlatformAdminAccount
}

interface ListPlatformAdminsResponse {
  admins: PlatformAdminAccount[]
}

class PlatformAdminService extends BaseService {
  private readonly path = '/platform/admins'

  bootstrap(payload: BootstrapPlatformAdminPayload): Promise<PlatformAdminAccount> {
    return this.http
      .post<PlatformAdminResponse>(`${this.path}/bootstrap`, payload)
      .then((data) => data.admin)
  }

  create(payload: CreatePlatformAdminPayload): Promise<PlatformAdminAccount> {
    return this.http.post<PlatformAdminResponse>(this.path, payload).then((data) => data.admin)
  }

  list(): Promise<PlatformAdminAccount[]> {
    return this.http.get<ListPlatformAdminsResponse>(this.path).then((data) => data.admins)
  }
}

export const platformAdminService = new PlatformAdminService()
