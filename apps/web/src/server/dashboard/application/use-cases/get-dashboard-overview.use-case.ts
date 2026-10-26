import { buildDashboardPeriods } from '../../domain/dashboard-periods'
import { resolveDashboardScope } from '../../domain/dashboard-scope'
import type { DashboardOverview, GetDashboardOverviewInput } from '../../types/dashboard-overview'
import type { DashboardOverviewRepository } from '../ports/dashboard-overview-repository.port'

export const DASHBOARD_RECENT_LEADS_LIMIT = 5
export const DASHBOARD_UPCOMING_ACTIVITIES_LIMIT = 5

export class GetDashboardOverviewUseCase {
  constructor(
    private readonly repository: DashboardOverviewRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(input: GetDashboardOverviewInput): Promise<DashboardOverview> {
    const scope = resolveDashboardScope(input)
    const periods = buildDashboardPeriods(this.clock())

    const [
      activeLeads,
      activeLeadsCreatedToday,
      visitsThisMonth,
      visitsToday,
      openProposals,
      proposalsAwaitingResponse,
      recentLeads,
      upcomingActivities,
    ] = await Promise.all([
      this.repository.countActiveLeads(scope),
      this.repository.countActiveLeads(scope, periods.today),
      this.repository.countVisits(scope, periods.month),
      this.repository.countVisits(scope, periods.today),
      this.repository.countOpenProposals(scope, false),
      this.repository.countOpenProposals(scope, true),
      this.repository.findRecentLeads(scope, DASHBOARD_RECENT_LEADS_LIMIT),
      this.repository.findUpcomingActivities(
        scope,
        periods.now,
        DASHBOARD_UPCOMING_ACTIVITIES_LIMIT,
      ),
    ])

    return {
      metrics: {
        activeLeads,
        activeLeadsCreatedToday,
        visitsThisMonth,
        visitsToday,
        openProposals,
        proposalsAwaitingResponse,
      },
      recentLeads,
      upcomingActivities,
    }
  }
}
