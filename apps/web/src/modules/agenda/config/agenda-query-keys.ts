import { dashboardAgendaQueryKeys } from '@shared/config/dashboard-agenda-query-keys'

export const agendaQueryKeys = {
  notificationAll: dashboardAgendaQueryKeys.all,
  notifications: dashboardAgendaQueryKeys.notifications,
  all: ['agenda'] as const,
  events: () => ['agenda', 'events'] as const,
  tenant: (tenantId: string | undefined) => ['agenda', 'events', tenantId] as const,
  range: (tenantId: string, from: string, to: string, userId?: string, role?: string) =>
    ['agenda', 'events', tenantId, from, to, userId, role] as const,
  properties: (tenantId?: string, userId?: string, role?: string, search = '') =>
    ['agenda', 'properties', tenantId, userId, role, search] as const,
  agents: (tenantId?: string, userId?: string, role?: string) =>
    ['agenda', 'agents', tenantId, userId, role] as const,
  organization: (
    source: 'charges' | 'maintenance',
    tenantId?: string,
    userId?: string,
    role?: string,
  ) => ['agenda', source, tenantId, userId, role] as const,
}
