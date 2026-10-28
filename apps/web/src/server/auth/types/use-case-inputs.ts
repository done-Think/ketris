import type { AppLocale } from '@/i18n/types/locale.types'
import type { UserRole, TenantMemberRole } from '../domain/user.entity'

export interface ApproveUserMembershipInput {
  actorId: string
  actorTenantId: string
  actorRole: UserRole
  userId: string
}

export interface ChangeOwnPasswordInput {
  userId: string
  currentPassword: string
  password: string
}

export interface CreateUserInput {
  actorId: string
  actorTenantId: string
  actorRole: UserRole
  name: string
  email: string
  password: string
  role: TenantMemberRole
}

export interface DeactivateUserInput {
  actorId: string
  actorTenantId: string
  actorRole: UserRole
  userId: string
}

export interface GetUserInput {
  actorId?: string
  actorTenantId: string
  actorRole: UserRole
  userId: string
}

export interface ListUsersInput {
  page?: number
  pageSize?: number
  pendingApproval?: boolean
  actorTenantId: string
  actorRole: UserRole
}

export interface LoginInput {
  email: string
  password: string
  tenantId?: string
}

export interface LogoutInput {
  refreshToken: string
}

export interface RefreshAccessTokenInput {
  refreshToken: string
}

export interface RequestPasswordResetCodeInput {
  email: string
  locale: AppLocale
}

export interface ResetPasswordInput {
  email: string
  password: string
  resetToken: string
  tenantId?: string
}

export interface UpdateUserInput {
  phone?: string | null
  creci?: string | null
  actorId: string
  actorTenantId: string
  actorRole: UserRole
  userId: string
  name?: string
  email?: string
  avatarUrl?: string | null
  role?: TenantMemberRole
}

export interface VerifyPasswordResetCodeInput {
  email: string
  code: string
  tenantId?: string
}
