import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { dashboardQueryKeys } from '../config/dashboard-query-keys'
import { dashboardService } from '../services/dashboard-service'
import { toDashboardOverviewView } from '../utils/dashboard-overview-view'

export function useDashboardOverview() {
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const userId = session?.user?.id

  return useQuery({
    queryKey: dashboardQueryKeys.overview(tenantId ?? '', userId ?? ''),
    queryFn: () => dashboardService.getOverview(),
    select: toDashboardOverviewView,
    enabled: Boolean(tenantId && userId),
  })
}
