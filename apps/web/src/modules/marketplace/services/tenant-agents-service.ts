import { BaseService } from '@shared/lib/api/base-service'

import type { ListTenantUsersResponse, TenantAgent } from '../types/tenant-agent'

export class TenantAgentsService extends BaseService {
  private readonly path = '/auth/users'

  // Only brokers can be featured; invited people show up after they accept the invitation.
  list(): Promise<TenantAgent[]> {
    return this.http
      .get<ListTenantUsersResponse>(this.path, {
        params: { pendingInvitation: 'false', pageSize: 100 },
      })
      .then((data) => data.users.filter((user) => user.role === 'AGENT' && user.active))
  }
}

export const tenantAgentsService = new TenantAgentsService()
