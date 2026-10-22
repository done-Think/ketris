import type { PlatformPlan } from '../../domain/platform-plan'
import type { TenantAccountType } from '../../domain/tenant-account'
import type {
  PlatformPlanPrices,
  PlatformPlanRepository,
} from '../ports/platform-plan-repository.port'

export interface UpdatePlatformPlanInput extends PlatformPlanPrices {
  accountType: TenantAccountType
}

export class UpdatePlatformPlanUseCase {
  constructor(private readonly platformPlanRepository: PlatformPlanRepository) {}

  execute({ accountType, ...prices }: UpdatePlatformPlanInput): Promise<PlatformPlan> {
    return this.platformPlanRepository.update(accountType, prices)
  }
}
