import { BaseService } from '@shared/lib/api/base-service'

import type {
  CreatePlatformAdminPayload,
  ListPlatformAdminsResponse,
  PlatformAdminAccount,
  PlatformAdminResponse,
} from '../types/platform-admin'

class PlatformAdminService extends BaseService {
  private readonly path = '/platform/admins'

  create(payload: CreatePlatformAdminPayload): Promise<PlatformAdminAccount> {
    return this.http.post<PlatformAdminResponse>(this.path, payload).then((data) => data.admin)
  }

  list(): Promise<PlatformAdminAccount[]> {
    return this.http.get<ListPlatformAdminsResponse>(this.path).then((data) => data.admins)
  }
}

export const platformAdminService = new PlatformAdminService()
