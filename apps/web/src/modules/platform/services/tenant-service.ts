import { BaseService } from '@shared/lib/api/base-service'

import type {
  CreateTenantAdminPayload,
  CreateTenantAdminResponse,
  CreateTenantPayload,
  CreateTenantResponse,
  ListTenantsResponse,
  ListTenantUsersResponse,
  PlatformTenant,
  TenantSummary,
  TenantUser,
  UpdateTenantAccountPayload,
  UpdateTenantAccountResponse,
} from '../types/tenant'

class TenantService extends BaseService {
  private readonly path = '/platform/tenants'

  list(): Promise<PlatformTenant[]> {
    return this.http.get<ListTenantsResponse>(this.path).then((data) => data.tenants)
  }

  updateAccount(tenantId: string, payload: UpdateTenantAccountPayload): Promise<PlatformTenant> {
    return this.http
      .patch<UpdateTenantAccountResponse>(`${this.path}/${tenantId}/account`, payload)
      .then((data) => data.tenant)
  }

  create(payload: CreateTenantPayload): Promise<TenantSummary> {
    return this.http.post<CreateTenantResponse>(this.path, payload).then((data) => data.tenant)
  }

  listUsers(tenantId: string): Promise<TenantUser[]> {
    return this.http
      .get<ListTenantUsersResponse>(`${this.path}/${tenantId}/users`)
      .then((data) => data.users)
  }

  createAdmin(tenantId: string, payload: CreateTenantAdminPayload): Promise<TenantUser> {
    return this.http
      .post<CreateTenantAdminResponse>(`${this.path}/${tenantId}/admins`, payload)
      .then((data) => data.user)
  }
}

export const tenantService = new TenantService()
