import { PlatformPlanNotFoundError } from '../../domain/errors'
import type { PlatformPlan } from '../../types/platform-plan'
import type { UpdatePlatformPlanInput } from '../../types/use-case-inputs'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'

export class UpdatePlatformPlanUseCase {
  constructor(private readonly platformPlanRepository: PlatformPlanRepository) {}

  async execute({ accountType, actor, ...prices }: UpdatePlatformPlanInput): Promise<PlatformPlan> {
    const plan = await this.platformPlanRepository.update(accountType, prices, actor)
    if (!plan) throw new PlatformPlanNotFoundError()

    return plan
  }
}
