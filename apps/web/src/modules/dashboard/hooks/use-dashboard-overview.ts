import { useQuery } from '@tanstack/react-query'

import { dashboardService } from '../services/dashboard-service'

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  user: (tenantId: string, userId: string) =>
    [...dashboardQueryKeys.all, tenantId, userId] as const,
  overview: (tenantId: string, userId: string) =>
    [...dashboardQueryKeys.user(tenantId, userId), 'overview'] as const,
}

export function useDashboardOverview(
  tenantId: string | null | undefined,
  userId: string | null | undefined,
) {
  return useQuery({
    queryKey: dashboardQueryKeys.overview(tenantId ?? '', userId ?? ''),
    queryFn: () => dashboardService.getOverview(),
    enabled: Boolean(tenantId && userId),
  })
}
