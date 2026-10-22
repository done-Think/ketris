import { BaseService } from '@shared/lib/api/base-service'

import type { ApiSystemHealth } from '../types/platform-system'

class PlatformSystemService extends BaseService {
  private readonly path = '/platform/system/health'

  getHealth(): Promise<ApiSystemHealth> {
    return this.http.get<ApiSystemHealth>(this.path)
  }
}

export const platformSystemService = new PlatformSystemService()
