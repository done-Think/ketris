import { BaseService } from '@shared/lib/api/base-service'

import type { ApiDashboardOverview } from '../types/service'

export class DashboardService extends BaseService {
  private readonly path = '/dashboard'

  getOverview(): Promise<ApiDashboardOverview> {
    return this.http.get<ApiDashboardOverview>(`${this.path}/overview`)
  }
}

export const dashboardService = new DashboardService()
