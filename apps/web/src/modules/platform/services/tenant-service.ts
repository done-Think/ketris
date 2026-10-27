import { BaseService } from '@shared/lib/api/base-service'

import type {
  CreateTenantAdminPayload,
  CreateTenantAdminResponse,
  CreateTenantPayload,
  CreateTenantResponse,
  GetTenantResponse,
  ListTenantsResponse,
  ListTenantUsersResponse,
  TenantListQuery,
  TenantPage,
  TenantUsersPage,
  PlatformTenant,
  TenantSummary,
  TenantUser,
  UpdateTenantAccountPayload,
  UpdateTenantAccountResponse,
} from '../types/tenant'

class TenantService extends BaseService {
  private readonly path = '/platform/tenants'

  list(query: TenantListQuery): Promise<TenantPage> {
    return this.http.get<ListTenantsResponse>(this.path, { params: query })
  }

  get(tenantId: string): Promise<PlatformTenant> {
    return this.http.get<GetTenantResponse>(`${this.path}/${tenantId}`).then((data) => data.tenant)
  }

  updateAccount(tenantId: string, payload: UpdateTenantAccountPayload): Promise<PlatformTenant> {
    return this.http
      .patch<UpdateTenantAccountResponse>(`${this.path}/${tenantId}/account`, payload)
      .then((data) => data.tenant)
  }

  create(payload: CreateTenantPayload): Promise<TenantSummary> {
    return this.http.post<CreateTenantResponse>(this.path, payload).then((data) => data.tenant)
  }

  listUsers(tenantId: string, page: number, pageSize: number): Promise<TenantUsersPage> {
    return this.http.get<ListTenantUsersResponse>(`${this.path}/${tenantId}/users`, {
      params: { page, pageSize },
    })
  }

  createAdmin(tenantId: string, payload: CreateTenantAdminPayload): Promise<TenantUser> {
    return this.http
      .post<CreateTenantAdminResponse>(`${this.path}/${tenantId}/admins`, payload)
      .then((data) => data.user)
  }
}

export const tenantService = new TenantService()
