import type { SystemHealth } from '../../domain/system-health.entity'
import type { DatabaseHealthProbe, ErrorTrackingProvider } from '../ports/system-health.port'

export class GetSystemHealthUseCase {
  constructor(
    private readonly databaseHealthProbe: DatabaseHealthProbe,
    private readonly errorTrackingProvider: ErrorTrackingProvider,
    private readonly serverUptimeSeconds: () => number = () => process.uptime(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<SystemHealth> {
    const [database, errorTracking] = await Promise.all([
      this.databaseHealthProbe.check(),
      this.errorTrackingProvider.getRecentIssues(),
    ])

    return {
      checkedAt: this.now(),
      database,
      serverUptimeSeconds: Math.floor(this.serverUptimeSeconds()),
      errorTracking,
    }
  }
}
