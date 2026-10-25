import type { UserListPage, UserListQuery } from '../../types/user-list'

export interface UserListRepository {
  findPageByTenant(tenantId: string, query: UserListQuery): Promise<UserListPage>
}
