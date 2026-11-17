import { BaseService } from '@shared/lib/api/base-service'

import type { ListTeamMembersResponse, TenantAgent } from '../types/tenant-agent'

export class TenantAgentsService extends BaseService {
  private readonly path = '/team'

  list(): Promise<TenantAgent[]> {
    return this.http
      .get<ListTeamMembersResponse>(this.path)
      .then((data) => data.members.filter((member) => member.active && !member.invitation))
  }
}

export const tenantAgentsService = new TenantAgentsService()
