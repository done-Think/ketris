import { BaseService } from '@shared/lib/api/base-service'

import type {
  ApiPlatformPlan,
  ListPlatformPlansResponse,
  UpdatePlatformPlanPayload,
  UpdatePlatformPlanResponse,
} from '../types/platform-plan'
import type { TenantAccountType } from '../types/tenant'

class PlatformPlanService extends BaseService {
  private readonly path = '/platform/plans'

  list(): Promise<ApiPlatformPlan[]> {
    return this.http.get<ListPlatformPlansResponse>(this.path).then((data) => data.plans)
  }

  update(
    accountType: TenantAccountType,
    payload: UpdatePlatformPlanPayload,
  ): Promise<UpdatePlatformPlanResponse['plan']> {
    return this.http
      .patch<UpdatePlatformPlanResponse>(`${this.path}/${accountType}`, payload)
      .then((data) => data.plan)
  }
}

export const platformPlanService = new PlatformPlanService()
