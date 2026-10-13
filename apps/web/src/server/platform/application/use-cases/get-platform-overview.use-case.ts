import type { PlatformOverview } from '../../domain/platform-overview.entity'
import type { PlatformOverviewRepository } from '../ports/platform-overview-repository.port'

export class GetPlatformOverviewUseCase {
  constructor(private readonly platformOverviewRepository: PlatformOverviewRepository) {}

  execute(): Promise<PlatformOverview> {
    return this.platformOverviewRepository.getOverview(new Date())
  }
}
