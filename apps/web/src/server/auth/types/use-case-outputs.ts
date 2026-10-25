import type { AuthenticatedUserListPage } from './user-list'
import type { TenantLoginChoice } from './tenant-login'
import type { AuthenticatedUser } from '../domain/user.entity'

export type ApproveUserMembershipOutput = AuthenticatedUser

export type CreateUserOutput = AuthenticatedUser

export type DeactivateUserOutput = AuthenticatedUser

export type GetUserOutput = AuthenticatedUser

export type ListUsersOutput = AuthenticatedUserListPage

export interface LoginOutput {
  user: AuthenticatedUser
  accessToken: string
  refreshToken: string
}

export interface RefreshAccessTokenOutput {
  accessToken: string
  refreshToken: string
}

export type UpdateUserOutput = AuthenticatedUser

export type VerifyPasswordResetCodeOutput =
  { resetToken: string } | { outcome: 'SELECT_TENANT'; tenants: TenantLoginChoice[] }
