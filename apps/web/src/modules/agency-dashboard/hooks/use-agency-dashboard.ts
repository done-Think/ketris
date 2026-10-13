import { useQuery } from '@tanstack/react-query'

import { agencyDashboardService } from '../services/agency-dashboard-service'

export const agencyDashboardQueryKeys = {
  all: ['agency-dashboard'] as const,
  tenant: (tenantId: string) => [...agencyDashboardQueryKeys.all, tenantId] as const,
  overview: (tenantId: string) =>
    [...agencyDashboardQueryKeys.tenant(tenantId), 'overview'] as const,
}

export function useAgencyOverview(tenantId: string | null | undefined) {
  const scopedTenantId = tenantId ?? ''

  return useQuery({
    queryKey: agencyDashboardQueryKeys.overview(scopedTenantId),
    queryFn: () => agencyDashboardService.getOverview(),
    enabled: Boolean(tenantId),
  })
}
