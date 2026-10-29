import type { z } from 'zod'

import type { dashboardOverviewResponseSchema } from '../schemas/dashboard-overview.schema'

export type DashboardOverviewResponse = z.infer<typeof dashboardOverviewResponseSchema>
