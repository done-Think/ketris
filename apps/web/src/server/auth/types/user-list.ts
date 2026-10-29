import type { User } from '../domain/user.entity'
import type { AuthenticatedUser } from './authenticated-user'

export interface UserListQuery {
  page: number
  pageSize: number
  pendingApproval?: boolean
}
export interface UserListPage {
  users: User[]
  total: number
  page: number
  pageSize: number
}
export interface AuthenticatedUserListPage extends Omit<UserListPage, 'users'> {
  users: AuthenticatedUser[]
}
