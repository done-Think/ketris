import { BaseService } from '@shared/lib/api/base-service'

import type { TenantSummary, TenantUser } from '../types/tenant'

interface CreateTenantPayload {
  nome: string
  slug: string
}

interface CreateTenantAdminPayload {
  nome: string
  email: string
  password: string
}

interface ListTenantsResponse {
  tenants: TenantSummary[]
}

interface CreateTenantResponse {
  tenant: TenantSummary
}

interface ListTenantUsersResponse {
  users: TenantUser[]
}

interface CreateTenantAdminResponse {
  user: TenantUser
}

class TenantService extends BaseService {
  private readonly path = '/platform/tenants'

  list(): Promise<TenantSummary[]> {
    return this.http.get<ListTenantsResponse>(this.path).then((data) => data.tenants)
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
