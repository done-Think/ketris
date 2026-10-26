export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  overview: (tenantId: string, userId: string) =>
    [...dashboardQueryKeys.all, tenantId, userId, 'overview'] as const,
  agencyOverview: (tenantId: string) =>
    [...dashboardQueryKeys.all, tenantId, 'agency-overview'] as const,
}
