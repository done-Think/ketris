import { BaseService } from '@shared/lib/api/base-service'

import type { ApiAgencyOverview } from '../types/service'

export class AgencyDashboardService extends BaseService {
  private readonly path = '/agency-dashboard'

  getOverview(): Promise<ApiAgencyOverview> {
    return this.http.get<ApiAgencyOverview>(`${this.path}/overview`)
  }
}

export const agencyDashboardService = new AgencyDashboardService()
