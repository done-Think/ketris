export const dashboardAgendaQueryKeys = {
  all: ['dashboard-agenda-notifications'] as const,
  notifications: (tenantId?: string, userId?: string, role?: string, day?: string) =>
    ['dashboard-agenda-notifications', tenantId, userId, role, day] as const,
}
