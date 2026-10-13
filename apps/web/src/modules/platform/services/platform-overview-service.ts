import { BaseService } from '@shared/lib/api/base-service'

import type { ApiPlatformOverview } from '../types/platform-overview'

class PlatformOverviewService extends BaseService {
  private readonly path = '/platform/overview'

  get(): Promise<ApiPlatformOverview> {
    return this.http.get<ApiPlatformOverview>(this.path)
  }
}

export const platformOverviewService = new PlatformOverviewService()
