import { GetDashboardOverviewUseCase } from './application/use-cases/get-dashboard-overview.use-case'
import { PrismaDashboardOverviewRepository } from './infrastructure/prisma-dashboard-overview.repository'

export const dashboardContainer = {
  getDashboardOverviewUseCase: new GetDashboardOverviewUseCase(
    new PrismaDashboardOverviewRepository(),
  ),
}
