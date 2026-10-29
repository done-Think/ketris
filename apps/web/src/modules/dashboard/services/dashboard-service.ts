import { BaseService } from '@shared/lib/api/base-service'

import type { ApiAgencyOverview } from '../types/agency-service'
import type { ApiDashboardOverview } from '../types/service'

export class DashboardService extends BaseService {
  getOverview(): Promise<ApiDashboardOverview> {
    return this.http.get<ApiDashboardOverview>('/dashboard/overview')
  }

  getAgencyOverview(): Promise<ApiAgencyOverview> {
    return this.http.get<ApiAgencyOverview>('/agency-dashboard/overview')
  }
}

export const dashboardService = new DashboardService()
