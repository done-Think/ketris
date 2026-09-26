import { BaseService } from '@shared/lib/api/base-service'

import type { TenantUser } from '../types/user'

interface ListUsersResponse {
  users: TenantUser[]
}

interface ApproveMembershipResponse {
  user: TenantUser
}

class UserService extends BaseService {
  private readonly path = '/auth/users'

  list(): Promise<TenantUser[]> {
    return this.http.get<ListUsersResponse>(this.path).then((data) => data.users)
  }

  approveMembership(id: string): Promise<TenantUser> {
    return this.http
      .patch<ApproveMembershipResponse>(`${this.path}/${id}/approve`)
      .then((data) => data.user)
  }
}

export const userService = new UserService()
