import { BaseService } from '@shared/lib/api/base-service'

import type { ListTenantUsersResponse, TenantAgent } from '../types/tenant-agent'

export class TenantAgentsService extends BaseService {
  private readonly path = '/auth/users'

  list(): Promise<TenantAgent[]> {
    return this.http
      .get<ListTenantUsersResponse>(this.path)
      .then((data) => data.users.filter((user) => user.role === 'AGENT' && user.active))
  }
}

export const tenantAgentsService = new TenantAgentsService()
