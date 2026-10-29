import type { TenantListQuery } from '../types/tenant'

export const platformQueryKeys = {
  all: (actor: string) => ['platform', actor] as const,
  tenants: (actor: string) => [...platformQueryKeys.all(actor), 'tenants'] as const,
  tenantPage: (actor: string, query: TenantListQuery) =>
    [...platformQueryKeys.tenants(actor), 'page', query] as const,
  tenant: (actor: string, tenantId: string) =>
    [...platformQueryKeys.tenants(actor), 'detail', tenantId] as const,
  tenantUsers: (actor: string, tenantId: string) =>
    [...platformQueryKeys.tenants(actor), 'users', tenantId] as const,
  tenantUsersPage: (actor: string, tenantId: string, page: number, pageSize: number) =>
    [...platformQueryKeys.tenantUsers(actor, tenantId), page, pageSize] as const,
  admins: (actor: string) => [...platformQueryKeys.all(actor), 'admins'] as const,
  plans: (actor: string) => [...platformQueryKeys.all(actor), 'plans'] as const,
  finance: (actor: string) => [...platformQueryKeys.all(actor), 'finance'] as const,
  overview: (actor: string) => [...platformQueryKeys.all(actor), 'overview'] as const,
  systemHealth: (actor: string) => [...platformQueryKeys.all(actor), 'system-health'] as const,
}
