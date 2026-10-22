import { BaseService } from '@shared/lib/api/base-service'

import type { ApiPlatformFinance } from '../types/platform-finance'

class PlatformFinanceService extends BaseService {
  private readonly path = '/platform/finance'

  get(): Promise<ApiPlatformFinance> {
    return this.http.get<ApiPlatformFinance>(this.path)
  }
}

export const platformFinanceService = new PlatformFinanceService()
